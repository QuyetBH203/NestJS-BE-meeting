import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsInt, Min } from "class-validator"

export class PaginationDto {
  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  take: number = 20
}
