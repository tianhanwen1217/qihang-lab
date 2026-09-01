import { Expose, plainToClass } from "class-transformer";
import { ShareDTO } from "src/share/dto/share.dto";

export class FileDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  size: string;

  @Expose()
  visibility: string;

  @Expose()
  accessToken?: string;

  @Expose()
  linkExpiresAt?: Date;

  @Expose()
  linkEnabled: boolean;

  @Expose()
  passwordProtected: boolean;

  @Expose()
  views: number;

  @Expose()
  downloads: number;

  @Expose()
  stars: number;

  share: ShareDTO;

  from(partial: Partial<FileDTO>) {
    return plainToClass(FileDTO, partial, { excludeExtraneousValues: true });
  }
}
