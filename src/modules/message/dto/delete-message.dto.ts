import { IsUUID } from "class-validator"

export class DeleteDirectMessageDto {
  @IsUUID()
  directMessageId: string
}

export class DeleteGroupMessageDto {
  @IsUUID()
  groupMessageId: string
}
