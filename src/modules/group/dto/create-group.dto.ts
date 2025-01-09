import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsUrl } from "class-validator"

export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsUrl()
  imageUrl: string
}
