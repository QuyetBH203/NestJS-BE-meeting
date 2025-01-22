import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { UserGender, UserProvider } from "@prisma/client"
import { UserFacebookDto } from "./dto/user.dto"

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async finUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        profile: true,
      },
    })
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    })
  }

  async findUserByFacebookId(facebookId: string) {
    return this.prisma.user.findUnique({
      where: {
        facebookId,
      },
      include: {
        profile: true,
      },
    })
  }

  async createUserWithGoogle(email: string) {
    return this.prisma.user.create({
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
  }

  async createUserWithFacebook(data: UserFacebookDto) {
    return this.prisma.user.create({
      data: {
        provider: UserProvider.FACEBOOK,
        facebookId: data.facebookId,
        profile: {
          create: {
            fullName: data.name,
            gender: (data?.gender as UserGender) || null,
          },
        },
      },
      include: {
        profile: true,
      },
    })
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        refreshToken,
      },
    })
  }
}
