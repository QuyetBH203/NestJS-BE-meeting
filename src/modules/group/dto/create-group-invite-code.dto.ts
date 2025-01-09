import { ApiProperty } from "@nestjs/swagger"
import { IsInt, Min } from "class-validator"

export class CreateGroupInviteCodeDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  inviteCodeMaxNumberOfUses: number
}
