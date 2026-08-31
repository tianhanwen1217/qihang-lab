import { Expose, plainToInstance } from "class-transformer";

export class PublicFileDTO {
  @Expose()
  token: string;

  @Expose()
  name: string;

  @Expose()
  size: string;

  @Expose()
  createdAt: Date;

  @Expose()
  expiresAt: Date;

  @Expose()
  linkExpiresAt?: Date;

  @Expose()
  visibility: string;

  @Expose()
  passwordProtected: boolean;

  @Expose()
  uploader: string;

  @Expose()
  description?: string;

  @Expose()
  category: string;

  from(partial: Partial<PublicFileDTO>) {
    return plainToInstance(PublicFileDTO, partial, {
      excludeExtraneousValues: true,
    });
  }

  fromList(partial: Partial<PublicFileDTO>[]) {
    return partial.map((item) => this.from(item));
  }
}
