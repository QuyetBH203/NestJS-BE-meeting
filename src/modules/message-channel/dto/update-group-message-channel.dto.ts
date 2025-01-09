import { PartialType } from "@nestjs/swagger"
import { CreateGroupMessageChannelDto } from "./create-group-message-channel.dto"

export class UpdateGroupMessageChannelDto extends PartialType(
  CreateGroupMessageChannelDto,
) {}
