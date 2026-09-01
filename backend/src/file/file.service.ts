import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import * as argon from "argon2";
import * as crypto from "crypto";
import * as moment from "moment";
import { LocalFileService } from "./local.service";
import { S3FileService } from "./s3.service";
import { ConfigService } from "src/config/config.service";
import { Readable } from "stream";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateFileAccessDTO } from "./dto/updateFileAccess.dto";
import { normalizeUploadedFilePath } from "./filePath.util";

@Injectable()
export class FileService {
  constructor(
    private prisma: PrismaService,
    private localFileService: LocalFileService,
    private s3FileService: S3FileService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  // Determine which service to use based on the current config value
  // shareId is optional -> can be used to overwrite a storage provider
  private getStorageService(
    storageProvider?: string,
  ): S3FileService | LocalFileService {
    if (storageProvider != undefined)
      return storageProvider == "S3"
        ? this.s3FileService
        : this.localFileService;
    return this.configService.get("s3.enabled")
      ? this.s3FileService
      : this.localFileService;
  }

  async create(
    data: string,
    chunk: { index: number; total: number },
    file: {
      id?: string;
      name: string;
    },
    shareId: string,
  ) {
    if (chunk.index === 0) {
      const normalizedName = normalizeUploadedFilePath(file.name);
      const duplicate = await this.prisma.file.findFirst({
        where: { shareId, name: normalizedName },
        select: { id: true },
      });
      if (duplicate && duplicate.id !== file.id) {
        throw new BadRequestException(
          "A file with the same relative path already exists in this package",
        );
      }
      file = { ...file, name: normalizedName };
    }
    const storageService = await this.getStorageServiceForShare(shareId);
    return storageService.create(
      data,
      chunk,
      { ...file, name: normalizeUploadedFilePath(file.name) },
      shareId,
    );
  }

  async get(shareId: string, fileId: string): Promise<File> {
    const storageService = await this.getStorageServiceForShare(shareId);
    return storageService.get(shareId, fileId);
  }

  async remove(shareId: string, fileId: string) {
    const storageService = await this.getStorageServiceForShare(shareId);
    return storageService.remove(shareId, fileId);
  }

  async cancelUpload(shareId: string, fileId: string) {
    const storageService = await this.getStorageServiceForShare(shareId);
    return storageService.cancelUpload(shareId, fileId);
  }

  async deleteAllFiles(shareId: string) {
    const storageService = await this.getStorageServiceForShare(shareId);
    return storageService.deleteAllFiles(shareId);
  }

  async getZip(shareId: string): Promise<Readable> {
    const storageService = await this.getStorageServiceForShare(shareId);
    return await storageService.getZip(shareId);
  }

  async recordShareDownload(shareId: string) {
    await this.prisma.file.updateMany({
      where: { shareId },
      data: { views: { increment: 1 } },
    });
  }

  async recordFileContentAccess(
    shareId: string,
    fileId: string,
    download: boolean,
  ) {
    await this.prisma.file.updateMany({
      where: { id: fileId, shareId },
      data: download
        ? { views: { increment: 1 } }
        : { previewViews: { increment: 1 } },
    });
  }

  private async getStorageServiceForShare(shareId: string) {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      select: { storageProvider: true },
    });
    if (!share) throw new NotFoundException("Share not found");
    return this.getStorageService(share.storageProvider);
  }

  async listPublic(search = "", page = 1, pageSize = 24) {
    const safePage = Math.max(1, page || 1);
    const safePageSize = Math.min(60, Math.max(1, pageSize || 24));
    const now = new Date();
    const where = {
      visibility: "PUBLIC",
      share: {
        uploadLocked: true,
        removedReason: null,
        OR: [
          { expiration: { gt: now } },
          { expiration: { equals: moment(0).toDate() } },
        ],
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { share: { description: { contains: search } } },
            ],
          }
        : {}),
    };

    const [files, total] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where,
        include: { share: { include: { creator: true } } },
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      items: files.map((file) => this.toPublicFile(file)),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async listPublicPackages(
    search = "",
    page = 1,
    pageSize = 12,
    category = "ALL",
    sort = "LATEST",
  ) {
    const safePage = Math.max(1, page || 1);
    const safePageSize = Math.min(30, Math.max(1, pageSize || 12));
    const now = new Date();
    const extensionsByCategory: Record<string, string[]> = {
      DOCUMENT: [
        ".pdf",
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
        ".xls",
        ".xlsx",
        ".csv",
        ".txt",
        ".md",
      ],
      IMAGE: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
      CODE: [
        ".js",
        ".ts",
        ".tsx",
        ".jsx",
        ".py",
        ".java",
        ".c",
        ".cpp",
        ".h",
        ".go",
        ".rs",
      ],
      ARCHIVE: [".zip", ".rar", ".7z", ".tar", ".gz"],
    };
    const categoryExtensions = extensionsByCategory[category] || [];
    const where = {
      uploadLocked: true,
      removedReason: null,
      contentDeletedAt: null,
      OR: [
        { expiration: { gt: now } },
        { expiration: { equals: moment(0).toDate() } },
      ],
      files: {
        some: {
          visibility: "PUBLIC",
          ...(categoryExtensions.length
            ? {
                OR: categoryExtensions.map((extension) => ({
                  name: { endsWith: extension },
                })),
              }
            : {}),
        },
      },
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: search } },
                  { description: { contains: search } },
                  {
                    files: {
                      some: {
                        visibility: "PUBLIC",
                        name: { contains: search },
                      },
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };

    const popular = sort === "POPULAR";
    const [foundPackages, total] = await this.prisma.$transaction([
      this.prisma.share.findMany({
        where,
        include: {
          creator: true,
          files: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: popular ? 0 : (safePage - 1) * safePageSize,
        take: popular ? 300 : safePageSize,
      }),
      this.prisma.share.count({ where }),
    ]);

    const packages = popular
      ? foundPackages
          .sort(
            (a, b) =>
              b.files.reduce((sum, file) => sum + file.views, 0) -
              a.files.reduce((sum, file) => sum + file.views, 0),
          )
          .slice((safePage - 1) * safePageSize, safePage * safePageSize)
      : foundPackages;

    return {
      items: packages.map((share) => {
        const publicFiles = share.files.filter(
          (file) => file.visibility === "PUBLIC",
        );
        const downloadableAsZip =
          share.isZipReady &&
          share.storageProvider === "LOCAL" &&
          share.files.length > 1 &&
          share.files.every((file) => file.visibility === "PUBLIC");
        return {
          name:
            share.name ||
            (publicFiles.length === 1 ? publicFiles[0].name : "未命名资料包"),
          description: share.description,
          createdAt: share.createdAt,
          expiresAt: share.expiration,
          uploader: share.creator?.username || "起航实验室",
          fileCount: publicFiles.length,
          totalSize: publicFiles.reduce(
            (sum, file) => sum + parseInt(file.size),
            0,
          ),
          views: publicFiles.reduce((sum, file) => sum + file.previewViews, 0),
          downloads: publicFiles.reduce((sum, file) => sum + file.views, 0),
          stars: publicFiles.reduce((sum, file) => sum + file.stars, 0),
          downloadableAsZip,
          downloadId: downloadableAsZip ? share.id : undefined,
          id: share.id,
          files: publicFiles
            .slice(0, 3)
            .map((file) => this.toPublicFile({ ...file, share })),
        };
      }),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async listPublicPackageFiles(shareId: string, page = 1, pageSize = 60) {
    const safePage = Math.max(1, page || 1);
    const safePageSize = Math.min(100, Math.max(1, pageSize || 60));
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: { creator: true },
    });
    if (!share) throw new NotFoundException("Package not found");
    this.assertShareIsAvailable(share);

    const where = { shareId, visibility: "PUBLIC" as const };
    const [files, total] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      items: files.map((file) => this.toPublicFile({ ...file, share })),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async getPublicPackageZip(shareId: string) {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: { files: true },
    });
    if (!share) throw new NotFoundException("Package not found");
    this.assertShareIsAvailable(share);
    if (
      !share.isZipReady ||
      share.storageProvider !== "LOCAL" ||
      share.files.length < 2 ||
      share.files.some((file) => file.visibility !== "PUBLIC")
    ) {
      throw new NotFoundException("Package download is not available");
    }
    const stream = await this.getZip(share.id);
    await this.prisma.file.updateMany({
      where: { shareId: share.id, visibility: "PUBLIC" },
      data: { views: { increment: 1 } },
    });
    return {
      name: share.name || "起航实验室资料包",
      stream,
    };
  }

  async getPublicMeta(accessToken: string, fileToken?: string) {
    const file = await this.getAccessibleFile(accessToken, fileToken, false);
    const viewedFile = await this.prisma.file.update({
      where: { id: file.id },
      data: { previewViews: { increment: 1 } },
      include: { share: { include: { creator: true } } },
    });
    return this.toPublicFile(viewedFile);
  }

  async getPublicContent(
    accessToken: string,
    fileToken: string | undefined,
    download: boolean,
  ) {
    const file = await this.getAccessibleFile(accessToken, fileToken, true);
    if (download) {
      await this.prisma.file.update({
        where: { id: file.id },
        data: { views: { increment: 1 } },
      });
    }
    return this.get(file.shareId, file.id);
  }

  async starPublicFile(accessToken: string, fileToken?: string) {
    const file = await this.getAccessibleFile(accessToken, fileToken, true);
    const starredFile = await this.prisma.file.update({
      where: { id: file.id },
      data: { stars: { increment: 1 } },
      select: { stars: true },
    });
    return starredFile;
  }

  async unlockPublicFile(accessToken: string, password?: string) {
    const file = await this.findPublicFile(accessToken);
    this.assertShareIsAvailable(file.share);

    if (file.visibility === "PUBLIC") return { token: null };
    this.assertLinkIsAvailable(file);

    if (file.linkPassword) {
      if (!password || !(await argon.verify(file.linkPassword, password))) {
        throw new ForbiddenException("Wrong password", "wrong_password");
      }
    }

    const expiresAt = this.effectiveLinkExpiration(file);
    return {
      token: this.jwtService.sign(
        { fileId: file.id, accessToken },
        {
          secret: this.configService.get("internal.jwtSecret"),
          expiresIn: Math.max(
            1,
            Math.floor((expiresAt.getTime() - Date.now()) / 1000),
          ),
        },
      ),
    };
  }

  async updateAccess(
    shareId: string,
    fileId: string,
    dto: UpdateFileAccessDTO,
    user: User,
  ) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, shareId },
      include: { share: true },
    });
    if (!file) throw new NotFoundException("File not found");

    let linkExpiresAt = file.linkExpiresAt;
    if (dto.linkExpiration) {
      if (dto.linkExpiration === "never") {
        if (!user.isAdmin || file.share.expiration.getTime() !== 0) {
          throw new ForbiddenException(
            "Only permanent files managed by the primary administrator can have permanent links",
          );
        }
        linkExpiresAt = null;
      } else {
        linkExpiresAt = parseRelativeFileDate(dto.linkExpiration);
        if (linkExpiresAt <= new Date()) {
          throw new BadRequestException(
            "Link expiration must be in the future",
          );
        }
        if (
          file.share.expiration.getTime() !== 0 &&
          linkExpiresAt > file.share.expiration
        ) {
          throw new BadRequestException(
            "Link expiration cannot exceed file expiration",
          );
        }
      }
    }

    const data: {
      visibility?: string;
      linkEnabled?: boolean;
      linkExpiresAt?: Date | null;
      linkPassword?: string | null;
      accessToken?: string;
    } = {
      visibility: dto.visibility,
      linkEnabled: dto.linkEnabled,
      linkExpiresAt,
    };

    if (dto.removePassword) data.linkPassword = null;
    if (dto.password) data.linkPassword = await argon.hash(dto.password);
    if (!file.accessToken || dto.regenerateToken) {
      data.accessToken = crypto.randomUUID();
    }

    const updated = await this.prisma.file.update({
      where: { id: file.id },
      data,
      include: { share: { include: { creator: true } } },
    });
    return {
      ...updated,
      views: updated.previewViews,
      downloads: updated.views,
      passwordProtected: !!updated.linkPassword,
    };
  }

  private async getAccessibleFile(
    accessToken: string,
    fileToken: string | undefined,
    requireUnlockedPassword: boolean,
  ) {
    const file = await this.findPublicFile(accessToken);
    this.assertShareIsAvailable(file.share);

    if (file.visibility === "PUBLIC") return file;
    this.assertLinkIsAvailable(file);

    if (file.linkPassword && requireUnlockedPassword) {
      try {
        const payload = this.jwtService.verify(fileToken, {
          secret: this.configService.get("internal.jwtSecret"),
        });
        if (payload.fileId !== file.id || payload.accessToken !== accessToken)
          throw new Error("token mismatch");
      } catch {
        throw new ForbiddenException(
          "File password required",
          "file_password_required",
        );
      }
    }
    return file;
  }

  private async findPublicFile(accessToken: string) {
    const file = await this.prisma.file.findUnique({
      where: { accessToken },
      include: { share: { include: { creator: true } } },
    });
    if (!file) throw new NotFoundException("File not found");
    return file;
  }

  private assertShareIsAvailable(share: {
    uploadLocked: boolean;
    expiration: Date;
    removedReason: string | null;
    contentDeletedAt?: Date | null;
  }) {
    if (
      !share.uploadLocked ||
      share.removedReason ||
      share.contentDeletedAt ||
      (share.expiration.getTime() !== 0 && share.expiration <= new Date())
    ) {
      throw new NotFoundException("File not found");
    }
  }

  private assertLinkIsAvailable(file: {
    linkEnabled: boolean;
    linkExpiresAt: Date | null;
    share: { expiration: Date };
  }) {
    if (!file.linkEnabled || this.effectiveLinkExpiration(file) <= new Date()) {
      throw new NotFoundException("File link expired or disabled");
    }
  }

  private effectiveLinkExpiration(file: {
    linkExpiresAt: Date | null;
    share: { expiration: Date };
  }) {
    const fileExpiration = file.share.expiration;
    if (file.linkExpiresAt && fileExpiration.getTime() !== 0) {
      return file.linkExpiresAt < fileExpiration
        ? file.linkExpiresAt
        : fileExpiration;
    }
    if (file.linkExpiresAt) return file.linkExpiresAt;
    if (fileExpiration.getTime() !== 0) return fileExpiration;
    return new Date(8640000000000000);
  }

  private toPublicFile(file: any) {
    return {
      token: file.accessToken,
      name: file.name,
      size: file.size,
      createdAt: file.createdAt,
      expiresAt: file.share.expiration,
      linkExpiresAt: file.linkExpiresAt,
      visibility: file.visibility,
      passwordProtected: !!file.linkPassword,
      uploader: file.share.creator?.username || "起航实验室",
      description: file.share.description,
      category: categoryFromFileName(file.name),
      views: file.previewViews,
      downloads: file.views,
      stars: file.stars,
    };
  }

  private async streamToUint8Array(stream: Readable): Promise<Uint8Array> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
      stream.on("error", reject);
    });
  }
}

function parseRelativeFileDate(value: string) {
  const match = value.match(/^(\d+)-(minutes|hours|days|weeks|months|years)$/);
  if (!match) throw new BadRequestException("Invalid link expiration");
  const amount = parseInt(match[1]);
  if (amount < 1 || amount > 9999) {
    throw new BadRequestException("Invalid link expiration");
  }
  return moment()
    .add(amount, match[2] as moment.unitOfTime.DurationConstructor)
    .toDate();
}

function categoryFromFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(extension)) return "PDF";
  if (["doc", "docx", "odt"].includes(extension)) return "Word";
  if (["ppt", "pptx", "odp"].includes(extension)) return "PPT";
  if (["xls", "xlsx", "csv", "ods"].includes(extension)) return "Excel";
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "压缩包";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension))
    return "图片";
  if (["mp3", "wav", "flac", "mp4", "mov", "webm"].includes(extension))
    return "媒体";
  if (
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "go",
      "rs",
    ].includes(extension)
  )
    return "代码";
  return "文件";
}

export interface File {
  metaData: {
    id: string;
    size: string;
    createdAt: Date;
    mimeType: string | false;
    name: string;
    shareId: string;
  };
  file: Readable;
}
