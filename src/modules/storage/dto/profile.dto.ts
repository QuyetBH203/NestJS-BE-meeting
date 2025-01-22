import { IsString } from "class-validator"

export class ProfileDto {
  @IsString()
  code: string
}
