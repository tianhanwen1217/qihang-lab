import {
  Body, Controller, Delete, Get, Param, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SkipThrottle } from "@nestjs/throttler";
import { Response } from "express";
import { AdministratorGuard } from "src/auth/guard/isAdmin.guard";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { RecruitmentService } from "./recruitment.service";

const imageInterceptor = FileInterceptor("file", {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)),
});

@Controller("recruitment")
export class RecruitmentController {
  constructor(private readonly service: RecruitmentService) {}

  @Get()
  @SkipThrottle()
  listPublic() { return this.service.listPublic(); }

  @Get("images/:filename")
  @SkipThrottle()
  async image(@Param("filename") filename: string, @Res() response: Response) {
    return response.sendFile(await this.service.imagePath(filename));
  }

  @Get("admin")
  @UseGuards(JwtGuard, AdministratorGuard)
  listAdmin() { return this.service.listAdmin(); }

  @Post("admin")
  @UseGuards(JwtGuard, AdministratorGuard)
  @UseInterceptors(imageInterceptor)
  create(@UploadedFile() file: Express.Multer.File, @Body() body: Record<string, string>) {
    return this.service.create(file, body);
  }

  @Patch("admin/:id")
  @UseGuards(JwtGuard, AdministratorGuard)
  update(@Param("id") id: string, @Body() body: Record<string, string>) {
    return this.service.update(id, body);
  }

  @Post("admin/:id/image")
  @UseGuards(JwtGuard, AdministratorGuard)
  @UseInterceptors(imageInterceptor)
  replaceImage(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.replaceImage(id, file);
  }

  @Delete("admin/:id")
  @UseGuards(JwtGuard, AdministratorGuard)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
