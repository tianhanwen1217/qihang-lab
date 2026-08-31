import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateFileAccessDTO {
  @IsOptional()
  @IsIn(["PUBLIC", "UNLISTED"])
  visibility?: "PUBLIC" | "UNLISTED";

  @IsOptional()
  @IsBoolean()
  linkEnabled?: boolean;

  @IsOptional()
  @IsString()
  linkExpiration?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  password?: string;

  @IsOptional()
  @IsBoolean()
  removePassword?: boolean;

  @IsOptional()
  @IsBoolean()
  regenerateToken?: boolean;
}
