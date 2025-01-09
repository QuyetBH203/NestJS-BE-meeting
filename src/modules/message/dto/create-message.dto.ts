import { MessageType } from "@prisma/client"
import { IsEnum, IsString, IsUUID, MinLength } from "class-validator"

export class CreateDirectMessageDto {
  @IsUUID()
  directMessageChannelId: string

  @IsEnum(MessageType)
  type: MessageType

  @IsString()
  @MinLength(1)
  value: string
}

export class CreateGroupMessageDto {
  @IsUUID()
  groupMessageChannelId: string

  @IsEnum(MessageType)
  type: MessageType

  @IsString()
  @MinLength(1)
  value: string
}
