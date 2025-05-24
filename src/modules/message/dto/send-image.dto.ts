import { IsUUID } from "class-validator"

export class SendImageDto {
  @IsUUID()
  channelId: string
}
