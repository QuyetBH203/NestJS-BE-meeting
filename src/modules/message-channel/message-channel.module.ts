import { Module } from "@nestjs/common"
import { DirectMessageChannelController } from "./controllers/direct-message-channel.controller"
import { GroupMessageChannelController } from "./controllers/group-message-channel.controller"

@Module({
  controllers: [DirectMessageChannelController, GroupMessageChannelController],
})
export class MessageChannelModule {}
