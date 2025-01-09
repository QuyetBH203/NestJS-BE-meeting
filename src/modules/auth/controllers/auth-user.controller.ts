import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { UserProvider } from "@prisma/client"
import { OAuth2Client } from "google-auth-library"
import { PrismaService } from "src/modules/prisma/prisma.service"
import { EnvPayload } from "src/types/env"
import { JwtPayload } from "src/types/jwt"
import { exclude } from "src/utils/exclude"
import { AuthService } from "../auth.service"
import { GoogleSignInDto } from "../dto/google-sign-in.dto"
import { RefreshTokenDto } from "../dto/refresh-token.dto"

@ApiTags("Auth User")
@ApiBearerAuth()
@Controller("auth/user")
export class AuthUserController {
  private oAuth2Client: OAuth2Client

  constructor(
    private configService: ConfigService<EnvPayload>,
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private authService: AuthService,
  ) {
    this.oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage",
    )
  }

  @ApiOperation({ summary: "Đăng nhập bằng Google" })
  @Post("google")
  async googleSignIn(@Body() { code }: GoogleSignInDto) {
    const {
      tokens: { access_token },
    } = await this.oAuth2Client.getToken(code)
    const { email } = await this.oAuth2Client.getTokenInfo(access_token)
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: {
        profile: true,
      },
    })
    if (user) {
      const accessToken = this.authService.generateAccessToken(user.id),
        refreshToken = this.authService.generateRefreshToken(user.id)
      await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          refreshToken,
        },
      })
      return {
        user: exclude(user, ["refreshToken"]),
        accessToken,
        refreshToken,
      }
    } else {
      const newUser = await this.prismaService.user.create({
        data: {
          provider: UserProvider.GOOGLE,
          email,
          profile: {
            create: {},
          },
        },
        include: {
          profile: true,
        },
      })
      const accessToken = this.authService.generateAccessToken(newUser.id),
        refreshToken = this.authService.generateRefreshToken(newUser.id)
      await this.prismaService.user.update({
        where: {
          id: newUser.id,
        },
        data: {
          refreshToken,
        },
      })
      return {
        user: exclude(newUser, ["refreshToken"]),
        accessToken,
        refreshToken,
      }
    }
  }

  @ApiOperation({ summary: "Refresh token" })
  @Post("refresh-token")
  async refreshToken(@Body() { refreshToken }: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get("JWT_REFRESH_TOKEN_SECRET"),
        },
      )
      const user = await this.prismaService.user.findUnique({
        where: {
          id: payload.id,
        },
      })
      if (!user || user.refreshToken !== refreshToken)
        throw new UnauthorizedException()

      const newRefreshToken = this.authService.generateRefreshToken(user.id)
      await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          refreshToken: newRefreshToken,
        },
      })
      return {
        accessToken: this.authService.generateAccessToken(user.id),
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
}
