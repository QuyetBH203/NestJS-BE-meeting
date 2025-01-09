import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { Socket } from "socket.io"
import { EnvPayload } from "src/types/env"
import { JwtPayload } from "src/types/jwt"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService<EnvPayload>,
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  generateAccessToken(id: string) {
    return this.jwtService.sign(
      {
        id,
      },
      {
        secret: this.configService.get("JWT_ACCESS_TOKEN_SECRET"),
        expiresIn: this.configService.get("JWT_ACCESS_TOKEN_EXPIRE"),
      },
    )
  }

  generateRefreshToken(id: string) {
    return this.jwtService.sign(
      {
        id,
      },
      {
        secret: this.configService.get("JWT_REFRESH_TOKEN_SECRET"),
        expiresIn: this.configService.get("JWT_REFRESH_TOKEN_EXPIRE"),
      },
    )
  }

  async getUserFromSocket(client: Socket) {
    try {
      const payload: JwtPayload = this.jwtService.verify(
        client.handshake.auth.accessToken,
        {
          secret: this.configService.get("JWT_ACCESS_TOKEN_SECRET"),
        },
      )
      return this.prismaService.user.findUnique({
        where: { id: payload.id },
      })
    } catch (error) {
      client.disconnect()
    }
  }
}
