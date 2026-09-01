import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import * as contentDisposition from "content-disposition";
import { Response } from "express";
import { Request } from "express";
import { User } from "@prisma/client";
import { GetUser } from "src/auth/decorator/getUser.decorator";
import { CreateShareGuard } from "src/share/guard/createShare.guard";
import { ShareOwnerGuard } from "src/share/guard/shareOwner.guard";
import { FileService } from "./file.service";
import { FileSecurityGuard } from "./guard/fileSecurity.guard";
import * as mime from "mime-types";
import { UpdateFileAccessDTO } from "./dto/updateFileAccess.dto";
import { ConfigService } from "src/config/config.service";
import { fileDownloadName } from "./filePath.util";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { AdministratorGuard } from "src/auth/guard/isAdmin.guard";
import { LocalFileService } from "./local.service";

@Controller("shares/:shareId/files")
export class FileController {
  constructor(private fileService: FileService) {}

  @Post()
  @SkipThrottle()
  @UseGuards(CreateShareGuard, ShareOwnerGuard)
  async create(
    @Query()
    query: {
      id: string;
      name: string;
      chunkIndex: string;
      totalChunks: string;
    },
    @Body() body: string,
    @Param("shareId") shareId: string,
  ) {
    const { id, name, chunkIndex, totalChunks } = query;

    // Data can be empty if the file is empty
    return await this.fileService.create(
      body,
      { index: parseInt(chunkIndex), total: parseInt(totalChunks) },
      { id, name },
      shareId,
    );
  }

  @Get("zip")
  @UseGuards(FileSecurityGuard)
  async getZip(
    @Res({ passthrough: true }) res: Response,
    @Param("shareId") shareId: string,
  ) {
    const zipStream = await this.fileService.getZip(shareId);
    await this.fileService.recordShareDownload(shareId);

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": contentDisposition(`${shareId}.zip`),
    });

    return new StreamableFile(zipStream);
  }

  @Get(":fileId")
  @UseGuards(FileSecurityGuard)
  async getFile(
    @Res({ passthrough: true }) res: Response,
    @Param("shareId") shareId: string,
    @Param("fileId") fileId: string,
    @Query("download") download = "true",
  ) {
    const file = await this.fileService.get(shareId, fileId);
    await this.fileService.recordFileContentAccess(
      shareId,
      fileId,
      download === "true",
    );

    const downloadName = fileDownloadName(file.metaData.name);
    const headers = {
      "Content-Type":
        mime?.lookup?.(file.metaData.name) || "application/octet-stream",
      "Content-Length": file.metaData.size,
      "Content-Security-Policy": "sandbox",
    };

    if (download === "true") {
      headers["Content-Disposition"] = contentDisposition(downloadName);
    } else {
      headers["Content-Disposition"] = contentDisposition(downloadName, {
        type: "inline",
      });
    }

    res.set(headers);

    return new StreamableFile(file.file);
  }

  @Delete(":fileId")
  @SkipThrottle()
  @UseGuards(ShareOwnerGuard)
  async remove(
    @Param("fileId") fileId: string,
    @Param("shareId") shareId: string,
  ) {
    await this.fileService.remove(shareId, fileId);
  }

  @Delete(":fileId/upload")
  @SkipThrottle()
  @UseGuards(ShareOwnerGuard)
  async cancelUpload(
    @Param("fileId") fileId: string,
    @Param("shareId") shareId: string,
  ) {
    await this.fileService.cancelUpload(shareId, fileId);
  }

  @Patch(":fileId/access")
  @UseGuards(ShareOwnerGuard)
  async updateAccess(
    @Param("fileId") fileId: string,
    @Param("shareId") shareId: string,
    @Body() body: UpdateFileAccessDTO,
    @GetUser() user: User,
  ) {
    return this.fileService.updateAccess(shareId, fileId, body, user);
  }
}

@Controller("public/files")
export class PublicFileController {
  constructor(
    private fileService: FileService,
    private config: ConfigService,
  ) {}

  @Get()
  async list(
    @Query("search") search = "",
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "24",
  ) {
    return this.fileService.listPublic(
      search.trim().slice(0, 100),
      parseInt(page),
      parseInt(pageSize),
    );
  }

  @Get("packages")
  async listPackages(
    @Query("search") search = "",
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "12",
    @Query("category") category = "ALL",
    @Query("sort") sort = "LATEST",
  ) {
    return this.fileService.listPublicPackages(
      search.trim().slice(0, 100),
      parseInt(page),
      parseInt(pageSize),
      category,
      sort,
    );
  }

  @Get("packages/:shareId/content")
  async getPackageContent(
    @Param("shareId") shareId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.fileService.getPublicPackageZip(shareId);
    response.set({
      "Content-Type": "application/zip",
      "Content-Disposition": contentDisposition(`${result.name}.zip`),
    });
    return new StreamableFile(result.stream);
  }

  @Get("packages/:shareId/files")
  async listPackageFiles(
    @Param("shareId") shareId: string,
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "60",
  ) {
    return this.fileService.listPublicPackageFiles(
      shareId,
      parseInt(page),
      parseInt(pageSize),
    );
  }

  @Get(":token")
  async getMeta(@Param("token") token: string, @Req() request: Request) {
    return this.fileService.getPublicMeta(
      token,
      request.cookies[this.cookieName(token)],
    );
  }

  @Post(":token/unlock")
  @Throttle({ default: { limit: 10, ttl: 5 * 60 } })
  async unlock(
    @Param("token") token: string,
    @Body() body: { password?: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.fileService.unlockPublicFile(
      token,
      body.password,
    );
    if (result.token) {
      response.cookie(this.cookieName(token), result.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: this.config.get("general.secureCookies"),
        path: `/api/public/files/${token}`,
      });
    }
    return { unlocked: true };
  }

  @Post(":token/star")
  async star(@Param("token") token: string, @Req() request: Request) {
    return this.fileService.starPublicFile(
      token,
      request.cookies[this.cookieName(token)],
    );
  }

  @Get(":token/content")
  async getContent(
    @Param("token") token: string,
    @Query("download") download = "true",
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.fileService.getPublicContent(
      token,
      request.cookies[this.cookieName(token)],
      download === "true",
    );
    const downloadName = fileDownloadName(file.metaData.name);
    const headers = {
      "Content-Type":
        mime?.lookup?.(file.metaData.name) || "application/octet-stream",
      "Content-Length": file.metaData.size,
      "Content-Security-Policy": "sandbox",
      "Content-Disposition": contentDisposition(downloadName, {
        type: download === "true" ? "attachment" : "inline",
      }),
    };
    response.set(headers);
    return new StreamableFile(file.file);
  }

  private cookieName(token: string) {
    return `qihang_file_${token}`;
  }
}

@Controller("admin/storage")
export class StorageController {
  constructor(private localFileService: LocalFileService) {}

  @Get()
  @UseGuards(JwtGuard, AdministratorGuard)
  async getStats() {
    return this.localFileService.getStorageStats();
  }
}
