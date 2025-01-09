import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsString, IsUUID } from "class-validator"
import { PaginationDto } from "src/dto/pagination.dto"

export class GetUserListDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  notInGroupId: string
}
