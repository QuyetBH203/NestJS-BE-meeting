import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { GoogleSignInDto } from "./dto/google-sign-in.dto"
import { RefreshTokenDto } from "./dto/refresh-token.dto"
import { AuthGuard } from "@nestjs/passport"

@ApiTags("Auth User")
@ApiBearerAuth()
@Controller("auth/user")
export class AuthUserController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Đăng nhập bằng Google" })
  @Post("google")
  async googleSignIn(@Body() { code }: GoogleSignInDto) {
    return await this.authService.loginWithGoogle(code)
  }

  @UseGuards(AuthGuard("facebook-token"))
  @Get("facebook")
  async facebookSignIn(@Req() req) {
    return await this.authService.loginWithFacebook(req.user)
  }

  @ApiOperation({ summary: "Refresh token" })
  @Post("refresh-token")
  async refreshToken(@Body() { refreshToken }: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshToken)
  }
}
