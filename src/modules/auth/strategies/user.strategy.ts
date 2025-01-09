import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { PrismaService } from "src/modules/prisma/prisma.service"
import { EnvPayload } from "src/types/env"
import { JwtPayload } from "src/types/jwt"
import { RequestWithUser } from "src/types/request"

@Injectable()
export class UserAccessTokenStrategy extends PassportStrategy(
  Strategy,
  "user-access-token",
) {
  constructor(
    private configService: ConfigService<EnvPayload>,
    private prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_ACCESS_TOKEN_SECRET"),
      passReqToCallback: true,
    })
  }

  async validate(request: RequestWithUser, payload: JwtPayload) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
      },
    })
    request.user = user
    return user
  }
}
