import { IsUUID } from "class-validator"

export class RequestCallDto {
  @IsUUID()
  toUserId: string
}
