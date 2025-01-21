import { IsOptional, IsString } from "class-validator"

export class UserFacebookDto {
  @IsString()
  facebookId: string

  @IsString()
  name: string

  @IsString()
  @IsOptional()
  gender: string
}
