import { ApiPropertyOptional } from "@nestjs/swagger"
import { UserGender } from "@prisma/client"
import { IsEnum, IsOptional, IsString, IsUrl } from "class-validator"

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatarUrl: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName: string

  @ApiPropertyOptional({
    enum: UserGender,
  })
  @IsOptional()
  @IsEnum(UserGender)
  gender: UserGender

  @ApiPropertyOptional()
  @IsString()
  phoneNumber: string
}
