import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { MessageGateway } from "./message.gateway"
import { StorageService } from "../storage/storage.service"
import { MessageController } from "./message.controller"

@Module({
  imports: [AuthModule],
  providers: [MessageGateway, StorageService],
  controllers: [MessageController],
})
export class MessageModule {}
