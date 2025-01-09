import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { MessageGateway } from "./message.gateway"

@Module({
  imports: [AuthModule],
  providers: [MessageGateway],
})
export class MessageModule {}
