import { Module } from "@nestjs/common"
import { PassportModule } from "@nestjs/passport"
import { UserModule } from "../user/user.module"
import { AuthService } from "./auth.service"
import { AuthUserController } from "./auth-user.controller"
import { UserAccessTokenStrategy } from "./strategies/user.strategy"
import { FacebookStrategy } from "./strategies/facebook.strategy"
import { AuthRepository } from "./auth.repository"

@Module({
  imports: [PassportModule, UserModule],
  controllers: [AuthUserController],
  providers: [
    AuthService,
    UserAccessTokenStrategy,
    FacebookStrategy,
    AuthRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
