import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { DATA_DIRECTORY } from "src/constants";

export type RecruitmentChannel = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  enabled: boolean;
  order: number;
};

@Injectable()
export class RecruitmentService {
  private readonly directory = path.resolve(DATA_DIRECTORY, "recruitment");
  private readonly configFile = path.join(this.directory, "channels.json");

  private async ensureDirectory() {
    await fs.promises.mkdir(this.directory, { recursive: true });
  }

  private async read(): Promise<RecruitmentChannel[]> {
    await this.ensureDirectory();
    try {
      const contents = await fs.promises.readFile(this.configFile, "utf8");
      const channels = JSON.parse(contents);
      return Array.isArray(channels) ? channels : [];
    } catch (error: any) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  private async write(channels: RecruitmentChannel[]) {
    await this.ensureDirectory();
    const tempFile = `${this.configFile}.tmp`;
    await fs.promises.writeFile(tempFile, JSON.stringify(channels, null, 2), "utf8");
    await fs.promises.rename(tempFile, this.configFile);
  }

  private sanitizeText(value: string | undefined, maxLength: number) {
    return (value || "").trim().slice(0, maxLength);
  }

  async listPublic() {
    return (await this.read())
      .filter((channel) => channel.enabled)
      .sort((a, b) => a.order - b.order)
      .map(({ id, name, description, imageUrl, order }) => ({ id, name, description, imageUrl, order }));
  }

  async listAdmin() {
    return (await this.read()).sort((a, b) => a.order - b.order);
  }

  async create(file: Express.Multer.File, data: Record<string, string>) {
    if (!file) throw new BadRequestException("请选择二维码图片");
    const name = this.sanitizeText(data.name, 40);
    if (!name) throw new BadRequestException("请填写渠道名称");

    const channels = await this.read();
    const id = crypto.randomUUID();
    const extension = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const filename = `${id}${extension}`;
    await fs.promises.writeFile(path.join(this.directory, filename), file.buffer);

    const channel: RecruitmentChannel = {
      id,
      name,
      description: this.sanitizeText(data.description, 120),
      imageUrl: `/api/recruitment/images/${filename}`,
      enabled: data.enabled !== "false",
      order: channels.length ? Math.max(...channels.map((item) => item.order)) + 1 : 0,
    };
    channels.push(channel);
    await this.write(channels);
    return channel;
  }

  async update(id: string, data: Record<string, string>) {
    const channels = await this.read();
    const channel = channels.find((item) => item.id === id);
    if (!channel) throw new NotFoundException("招新渠道不存在");

    const name = this.sanitizeText(data.name, 40);
    if (!name) throw new BadRequestException("请填写渠道名称");
    channel.name = name;
    channel.description = this.sanitizeText(data.description, 120);
    channel.enabled = data.enabled === "true";
    const requestedOrder = Number.parseInt(data.order, 10);
    if (Number.isFinite(requestedOrder)) channel.order = Math.max(0, requestedOrder);
    await this.write(channels);
    return channel;
  }

  async replaceImage(id: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException("请选择二维码图片");
    const channels = await this.read();
    const channel = channels.find((item) => item.id === id);
    if (!channel) throw new NotFoundException("招新渠道不存在");

    const extension = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const filename = `${id}-${Date.now()}${extension}`;
    await fs.promises.writeFile(path.join(this.directory, filename), file.buffer);
    const previousImage = channel.imageUrl;
    channel.imageUrl = `/api/recruitment/images/${filename}`;
    await this.write(channels);
    await this.removeImage(previousImage);
    return channel;
  }

  async remove(id: string) {
    const channels = await this.read();
    const index = channels.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException("招新渠道不存在");
    const [channel] = channels.splice(index, 1);
    await this.write(channels);
    await this.removeImage(channel.imageUrl);
  }

  async imagePath(filename: string) {
    if (!/^[a-zA-Z0-9-]+\.(png|jpe?g|webp)$/.test(filename)) throw new NotFoundException();
    const fullPath = path.join(this.directory, filename);
    try {
      await fs.promises.access(fullPath, fs.constants.R_OK);
      return fullPath;
    } catch {
      throw new NotFoundException();
    }
  }

  private async removeImage(imageUrl: string) {
    const filename = imageUrl.split("/").pop();
    if (!filename) return;
    await fs.promises.unlink(path.join(this.directory, filename)).catch(() => undefined);
  }
}
