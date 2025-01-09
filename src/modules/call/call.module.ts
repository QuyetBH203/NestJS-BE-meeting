import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { CallGateway } from "./call.gateway"

@Module({
  imports: [AuthModule],
  providers: [CallGateway],
})
export class CallModule {}
