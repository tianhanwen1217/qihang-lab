import { plainToClass } from "class-transformer";
import { IsOptional, MinLength } from "class-validator";
import { UserDTO } from "./user.dto";

export class CreateUserDTO extends UserDTO {
  @MinLength(8)
  @IsOptional()
  password: string;

  from(partial: Partial<CreateUserDTO>) {
    return plainToClass(CreateUserDTO, partial, {
      excludeExtraneousValues: true,
    });
  }
}
