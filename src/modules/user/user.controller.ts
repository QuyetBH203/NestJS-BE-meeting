import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { Prisma } from "@prisma/client"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { exclude } from "src/utils/exclude"
import { UserGuard } from "../auth/guards/user.guard"
import { PrismaService } from "../prisma/prisma.service"
import { GetUserListDto } from "./dto/get-user-list.dto"
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto"

@ApiTags("User")
@ApiBearerAuth()
@UseGuards(UserGuard)
@Controller("user")
export class UserController {
  constructor(private prismaService: PrismaService) {}

  @ApiOperation({ summary: "Lấy profile người dùng hiện tại" })
  @Get("profile")
  async getProfile(@CurrentUser({ field: "id" }) id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    })
    return exclude(user, ["refreshToken"])
  }

  @ApiOperation({ summary: "Cập nhật thông tin profile" })
  @Patch("profile")
  async updateProfile(
    @Body() data: UpdateUserProfileDto,
    @CurrentUser({ field: "id" }) id: string,
  ) {
    const profile = await this.prismaService.profile.update({
      where: {
        userId: id,
      },
      data,
    })
    return profile
  }

  @ApiOperation({ summary: "Lấy thông tin người dùng khác" })
  @Get(":targetId")
  async getUserById(
    @Param("targetId", ParseUUIDPipe) targetId: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: targetId },
      include: {
        profile: true,
        friendshipFromMe: {
          where: {
            fromUserId: targetId,
            toUserId: userId,
          },
        },
        friendshipRequestFromMe: {
          where: {
            fromUserId: targetId,
            toUserId: userId,
          },
        },
        friendshipRequestToMe: {
          where: {
            fromUserId: userId,
            toUserId: targetId,
          },
        },
      },
    })
    if (!user) throw new BadRequestException("User doesn't exist")
    const directMessageChannel =
      await this.prismaService.directMessageChannel.findFirst({
        where: {
          users: {
            every: {
              userId: {
                in: [targetId, userId],
              },
            },
          },
        },
      })
    return {
      profile: user.profile,
      isOnline: !!user.wsId,
      isFriendship: !!user.friendshipFromMe.length,
      friendshipRequestFromMe: !!user.friendshipRequestFromMe.length,
      friendshipRequestToMe: !!user.friendshipRequestToMe.length,
      directMessageChannelId: directMessageChannel?.id,
    }
  }

  @ApiOperation({ summary: "Lấy danh sách người dùng" })
  @Get()
  async getUserList(
    @Query() { keyword, notInGroupId, page, take }: GetUserListDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    let where: Prisma.UserWhereInput = {
      id: {
        not: userId,
      },
      profile: {
        fullName: {
          not: null,
        },
      },
      OR: keyword
        ? [
            {
              profile: {
                fullName: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },
            },
            {
              email: {
                contains: keyword,
                mode: "insensitive",
              },
            },
          ]
        : [],
    }

    if (notInGroupId)
      where.groups = {
        every: {
          groupId: {
            not: notInGroupId,
          },
        },
      }

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        select: {
          email: true,
          profile: true,
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.user.count({
        where,
      }),
    ])

    return {
      data: data.map(({ profile }) => profile),
      meta: {
        total,
        page,
        take,
      },
    }
  }
}
