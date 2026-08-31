import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { createReadStream, createWriteStream } from "fs";
import * as fs from "fs/promises";
import * as archiver from "archiver";
import * as mime from "mime-types";
import { ConfigService } from "src/config/config.service";
import { PrismaService } from "src/prisma/prisma.service";
import { validate as isValidUUID } from "uuid";
import { SHARE_DIRECTORY } from "../constants";
import { Readable } from "stream";
import { safeArchiveEntryPath } from "./filePath.util";

@Injectable()
export class LocalFileService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getStorageStats() {
    const space = await fs.statfs(SHARE_DIRECTORY);
    const total = space.blocks * space.bsize;
    const available = space.bavail * space.bsize;
    const used = Math.max(0, total - available);

    return {
      total,
      used,
      available,
      usagePercent: total > 0 ? Math.round((used / total) * 1000) / 10 : 0,
      path: SHARE_DIRECTORY,
    };
  }

  async create(
    data: string,
    chunk: { index: number; total: number },
    file: { id?: string; name: string },
    shareId: string,
  ) {
    if (!file.id) {
      file.id = crypto.randomUUID();
    } else if (!isValidUUID(file.id)) {
      throw new BadRequestException("Invalid file ID format");
    }

    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: { files: true, reverseShare: true },
    });

    if (share.uploadLocked)
      throw new BadRequestException("Share is already completed");

    // The server may have persisted the final chunk while the response was
    // lost on the network. Treat the same final request as successful so the
    // browser can finish a resumable retry instead of showing a false error.
    const existingFile = share.files.find((item) => item.id === file.id);
    if (existingFile && chunk.index === chunk.total - 1) {
      return { id: existingFile.id, name: existingFile.name };
    }
    if (existingFile) {
      throw new BadRequestException("File is already uploaded");
    }

    let diskFileSize: number;
    try {
      diskFileSize = (
        await fs.stat(`${SHARE_DIRECTORY}/${shareId}/${file.id}.tmp-chunk`)
      ).size;
    } catch {
      diskFileSize = 0;
    }

    // If the sent chunk index and the expected chunk index doesn't match throw an error
    const chunkSize = this.config.get("share.chunkSize");
    const expectedChunkIndex = Math.ceil(diskFileSize / chunkSize);

    if (expectedChunkIndex != chunk.index)
      throw new BadRequestException({
        message: "Unexpected chunk received",
        error: "unexpected_chunk_index",
        expectedChunkIndex,
      });

    const buffer = Buffer.from(data, "base64");

    // Check if there is enough space on the server
    const space = await fs.statfs(SHARE_DIRECTORY);
    const availableSpace = space.bavail * space.bsize;
    const reservedSpace = 512 * 1024 * 1024;
    if (availableSpace < buffer.byteLength + reservedSpace) {
      throw new HttpException(
        "Not enough space on the server",
        HttpStatus.INSUFFICIENT_STORAGE,
      );
    }

    // Check if share size limit is exceeded
    const fileSizeSum = share.files.reduce(
      (n, { size }) => n + parseInt(size),
      0,
    );

    const shareSizeSum = fileSizeSum + diskFileSize + buffer.byteLength;

    if (
      shareSizeSum > this.config.get("share.maxSize") ||
      (share.reverseShare?.maxShareSize &&
        shareSizeSum > parseInt(share.reverseShare.maxShareSize))
    ) {
      throw new HttpException(
        "Max share size exceeded",
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    await fs.appendFile(
      `${SHARE_DIRECTORY}/${shareId}/${file.id}.tmp-chunk`,
      buffer,
    );

    const isLastChunk = chunk.index == chunk.total - 1;
    if (isLastChunk) {
      await fs.rename(
        `${SHARE_DIRECTORY}/${shareId}/${file.id}.tmp-chunk`,
        `${SHARE_DIRECTORY}/${shareId}/${file.id}`,
      );
      const fileSize = (
        await fs.stat(`${SHARE_DIRECTORY}/${shareId}/${file.id}`)
      ).size;
      await this.prisma.file.create({
        data: {
          id: file.id,
          name: file.name,
          size: fileSize.toString(),
          visibility: share.visibility,
          accessToken: crypto.randomUUID(),
          linkExpiresAt: this.defaultLinkExpiration(share.expiration),
          share: { connect: { id: shareId } },
        },
      });
    }

    return file;
  }

  private defaultLinkExpiration(fileExpiration: Date) {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (fileExpiration.getTime() === 0) return thirtyDaysFromNow;
    return fileExpiration < thirtyDaysFromNow
      ? fileExpiration
      : thirtyDaysFromNow;
  }

  async get(shareId: string, fileId: string) {
    const fileMetaData = await this.prisma.file.findFirst({
      where: { id: fileId, shareId },
    });

    if (!fileMetaData) throw new NotFoundException("File not found");

    const file = createReadStream(`${SHARE_DIRECTORY}/${shareId}/${fileId}`);

    return {
      metaData: {
        mimeType: mime.contentType(fileMetaData.name.split(".").pop()),
        ...fileMetaData,
        size: fileMetaData.size,
      },
      file,
    };
  }

  async remove(shareId: string, fileId: string) {
    const fileMetaData = await this.prisma.file.findFirst({
      where: { id: fileId, shareId },
    });

    if (!fileMetaData) throw new NotFoundException("File not found");

    await fs.rm(`${SHARE_DIRECTORY}/${shareId}/${fileId}`, { force: true });

    await this.prisma.file.delete({ where: { id: fileId } });

    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      select: { uploadLocked: true },
    });
    if (share?.uploadLocked) {
      await this.removeZip(shareId);
      await this.prisma.share.update({
        where: { id: shareId },
        data: { isZipReady: false },
      });
      void this.rebuildZip(shareId).catch(() => undefined);
    } else {
      await this.removeZip(shareId);
      await this.prisma.share.update({
        where: { id: shareId },
        data: { isZipReady: false },
      });
    }
  }

  async cancelUpload(shareId: string, fileId: string) {
    if (!isValidUUID(fileId)) {
      throw new BadRequestException("Invalid file ID format");
    }

    const completedFile = await this.prisma.file.findFirst({
      where: { id: fileId, shareId },
    });
    if (completedFile) {
      await this.remove(shareId, fileId);
      return;
    }

    await fs.rm(`${SHARE_DIRECTORY}/${shareId}/${fileId}.tmp-chunk`, {
      force: true,
    });
  }

  async deleteAllFiles(shareId: string) {
    await fs.rm(`${SHARE_DIRECTORY}/${shareId}`, {
      recursive: true,
      force: true,
    });
  }

  private async removeZip(shareId: string) {
    await Promise.all([
      fs.rm(`${SHARE_DIRECTORY}/${shareId}/archive.zip`, { force: true }),
      fs.rm(`${SHARE_DIRECTORY}/${shareId}/archive.zip.tmp`, { force: true }),
    ]);
  }

  private async rebuildZip(shareId: string) {
    const files = await this.prisma.file.findMany({
      where: { shareId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    await this.removeZip(shareId);
    if (files.length <= 1) {
      await this.prisma.share.update({
        where: { id: shareId },
        data: { isZipReady: false },
      });
      return;
    }

    const temporaryArchive = `${SHARE_DIRECTORY}/${shareId}/archive.zip.tmp`;
    const finalArchive = `${SHARE_DIRECTORY}/${shareId}/archive.zip`;
    const archive = archiver("zip", {
      zlib: { level: this.config.get("share.zipCompressionLevel") },
    });
    const output = createWriteStream(temporaryArchive);

    try {
      await new Promise<void>((resolve, reject) => {
        output.on("close", resolve);
        output.on("error", reject);
        archive.on("error", reject);
        archive.pipe(output);
        files.forEach((file) =>
          archive.append(
            createReadStream(`${SHARE_DIRECTORY}/${shareId}/${file.id}`),
            { name: safeArchiveEntryPath(file.name, file.id) },
          ),
        );
        void archive.finalize().catch(reject);
      });
      await fs.rename(temporaryArchive, finalArchive);
      await this.prisma.share.update({
        where: { id: shareId },
        data: { isZipReady: true },
      });
    } catch (error) {
      await this.removeZip(shareId);
      await this.prisma.share.update({
        where: { id: shareId },
        data: { isZipReady: false },
      });
      throw error;
    }
  }

  async getZip(shareId: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const zipStream = createReadStream(
        `${SHARE_DIRECTORY}/${shareId}/archive.zip`,
      );

      zipStream.on("error", (err) => {
        reject(new InternalServerErrorException(err));
      });

      zipStream.on("open", () => {
        resolve(zipStream);
      });
    });
  }
}
