import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { Socket } from "socket.io"
import { EnvPayload } from "src/types/env"
import { JwtPayload } from "src/types/jwt"
import { AuthRepository } from "./auth.repository"
import { OAuth2Client } from "google-auth-library"
import { exclude } from "src/utils/exclude"
import { UserFacebookDto } from "./dto/user.dto"

@Injectable()
export class AuthService {
  private oAuth2Client: OAuth2Client

  constructor(
    private readonly configService: ConfigService<EnvPayload>,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {
    this.oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage",
    )
  }

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
      return await this.authRepository.findUserById(payload.id)
    } catch (error) {
      client.disconnect()
    }
  }

  async loginWithGoogle(code: string) {
    const {
      tokens: { access_token },
    } = await this.oAuth2Client.getToken(code)
    const { email } = await this.oAuth2Client.getTokenInfo(access_token)
    const user = await this.authRepository.finUserByEmail(email)
    if (user) {
      const accessToken = this.generateAccessToken(user.id),
        refreshToken = this.generateRefreshToken(user.id)
      await this.authRepository.updateRefreshToken(user.id, refreshToken)
      return {
        user: exclude(user, ["refreshToken"]),
        accessToken,
        refreshToken,
      }
    } else {
      const newUser = await this.authRepository.createUserWithGoogle(email)
      const accessToken = this.generateAccessToken(newUser.id),
        refreshToken = this.generateRefreshToken(newUser.id)
      await this.authRepository.updateRefreshToken(newUser.id, refreshToken)
      return {
        user: exclude(newUser, ["refreshToken"]),
        accessToken,
        refreshToken,
      }
    }
  }

  async loginWithFacebook(data: UserFacebookDto) {
    const user = await this.authRepository.findUserByFacebookId(data.facebookId)
    if (user) {
      const accessToken = this.generateAccessToken(user.id),
        refreshToken = this.generateRefreshToken(user.id)
      await this.authRepository.updateRefreshToken(user.id, refreshToken)
      return {
        user: exclude(user, ["refreshToken"]),
        accessToken,
        refreshToken,
      }
    } else {
      const newUser = await this.authRepository.createUserWithFacebook(data)
      const accessToken = this.generateAccessToken(newUser.id),
        refreshToken = this.generateRefreshToken(newUser.id)
      await this.authRepository.updateRefreshToken(newUser.id, refreshToken)
      return {
        user: exclude(newUser, ["refreshToken"]),
        accessToken,
        refreshToken,
      }
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get("JWT_REFRESH_TOKEN_SECRET"),
        },
      )
      const user = await this.authRepository.findUserById(payload.id)
      if (!user || user.refreshToken !== refreshToken)
        throw new UnauthorizedException()

      const newRefreshToken = this.generateRefreshToken(user.id)
      await this.authRepository.updateRefreshToken(user.id, newRefreshToken)
      return {
        accessToken: this.generateAccessToken(user.id),
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
}
