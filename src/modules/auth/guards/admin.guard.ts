import { Injectable } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

@Injectable()
export class AdminGuard extends AuthGuard("admin-access-token") {}

@Injectable()
export class AdminRefreshTokenGuard extends AuthGuard("admin-refresh-token") {}
