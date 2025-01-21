import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import * as FacebookTokenStrategy from "passport-facebook-token"

@Injectable()
export class FacebookStrategy extends PassportStrategy(
  FacebookTokenStrategy,
  "facebook-token",
) {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    console.log(profile)
    try {
      const user = {
        facebookId: profile.id,
        name: profile.displayName,
        gender: profile.gender?.charAt(0).toUpperCase() || null,
      }

      return user
    } catch (error) {
      console.error("Error fetching Facebook avatar:", error)
      throw new UnauthorizedException()
    }
  }
}
