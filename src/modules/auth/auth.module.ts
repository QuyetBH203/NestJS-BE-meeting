import { Module } from "@nestjs/common"
import { PassportModule } from "@nestjs/passport"
import { UserModule } from "../user/user.module"
import { AuthService } from "./auth.service"
import { AuthUserController } from "./controllers/auth-user.controller"
import { UserAccessTokenStrategy } from "./strategies/user.strategy"

@Module({
  imports: [PassportModule, UserModule],
  controllers: [AuthUserController],
  providers: [AuthService, UserAccessTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
