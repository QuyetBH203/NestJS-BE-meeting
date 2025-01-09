import {
  BadGatewayException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { FriendshipRequestStatus, Prisma } from "@prisma/client"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { PaginationDto } from "src/dto/pagination.dto"
import { UserGuard } from "../auth/guards/user.guard"
import { PrismaService } from "../prisma/prisma.service"

@ApiTags("Friend")
@ApiBearerAuth()
@UseGuards(UserGuard)
@Controller("friend")
export class FriendController {
  constructor(private prismaService: PrismaService) {}

  @ApiOperation({
    summary: "Gửi lời mời kết bạn",
  })
  @Post("request/:toUserId")
  async createFriendshipRequest(
    @Param("toUserId", ParseUUIDPipe) toUserId: string,
    @CurrentUser({ field: "id" }) fromUserId: string,
  ) {
    const friendshipRequest =
      await this.prismaService.friendshipRequest.findFirst({
        where: {
          OR: [
            {
              fromUserId,
              toUserId,
            },
            {
              fromUserId: toUserId,
              toUserId: fromUserId,
            },
          ],
        },
      })
    if (friendshipRequest)
      throw new BadGatewayException("Friendship request already exists")

    return this.prismaService.friendshipRequest.create({
      data: {
        fromUserId,
        toUserId,
      },
    })
  }

  @ApiOperation({
    summary: "Lấy danh sách yêu cầu kết bạn đã gửi",
  })
  @Get("request/from-me")
  async getFriendRequestFromMeList(
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const where: Prisma.FriendshipRequestWhereInput = {
      fromUserId: userId,
      status: FriendshipRequestStatus.PENDING,
    }
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.friendshipRequest.findMany({
        where,
        select: {
          toUser: {
            select: {
              profile: true,
            },
          },
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.friendshipRequest.count({
        where,
      }),
    ])

    return {
      data: data.map(({ toUser: { profile } }) => profile),
      meta: {
        total,
        page,
        take,
      },
    }
  }

  @ApiOperation({
    summary: "Lấy số lượng yêu cầu kết bạn đã gửi",
  })
  @Get("request/count-from-me")
  countFriendRequestFromMe(@CurrentUser({ field: "id" }) userId: string) {
    return this.prismaService.friendshipRequest.count({
      where: {
        fromUserId: userId,
        status: FriendshipRequestStatus.PENDING,
      },
    })
  }

  @ApiOperation({
    summary: "Lấy danh sách yêu cầu kết bạn nhận được",
  })
  @Get("request/to-me")
  async getFriendRequestToMeList(
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const where: Prisma.FriendshipRequestWhereInput = {
      toUserId: userId,
      status: FriendshipRequestStatus.PENDING,
    }
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.friendshipRequest.findMany({
        where,
        select: {
          fromUser: {
            select: {
              profile: true,
            },
          },
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.friendshipRequest.count({
        where,
      }),
    ])

    return {
      data: data.map(({ fromUser: { profile } }) => profile),
      meta: {
        total,
        page,
        take,
      },
    }
  }

  @ApiOperation({
    summary: "Lấy số lượng yêu cầu kết bạn nhận được",
  })
  @Get("request/count-to-me")
  countFriendRequestToMe(@CurrentUser({ field: "id" }) userId: string) {
    return this.prismaService.friendshipRequest.count({
      where: {
        toUserId: userId,
        status: FriendshipRequestStatus.PENDING,
      },
    })
  }

  @ApiOperation({
    summary: "Chấp nhận lời mời kết bạn",
  })
  @Post("request/:fromUserId/accept")
  async acceptFriendshipRequest(
    @Param("fromUserId", ParseUUIDPipe) fromUserId: string,
    @CurrentUser({ field: "id" }) toUserId: string,
  ) {
    const friendshipRequest =
      await this.prismaService.friendshipRequest.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId,
            toUserId,
          },
          status: FriendshipRequestStatus.PENDING,
        },
      })
    if (friendshipRequest) {
      const directMessageChannel =
        await this.prismaService.directMessageChannel.findFirst({
          where: {
            users: {
              every: {
                userId: {
                  in: [fromUserId, toUserId],
                },
              },
            },
          },
        })
      if (!directMessageChannel)
        await this.prismaService.directMessageChannel.create({
          data: {
            users: {
              createMany: {
                data: [
                  {
                    userId: fromUserId,
                  },
                  {
                    userId: toUserId,
                  },
                ],
              },
            },
          },
        })
      const [updatedFriendshipRequest] = await this.prismaService.$transaction([
        this.prismaService.friendshipRequest.update({
          where: {
            fromUserId_toUserId: {
              fromUserId,
              toUserId,
            },
          },
          data: {
            status: FriendshipRequestStatus.ACCEPTED,
          },
        }),
        this.prismaService.friendship.createMany({
          data: [
            {
              fromUserId,
              toUserId,
            },
            {
              fromUserId: toUserId,
              toUserId: fromUserId,
            },
          ],
        }),
      ])
      return updatedFriendshipRequest
    }
    throw new BadGatewayException("Friendship request doesn't exist")
  }

  @ApiOperation({
    summary: "Từ chối lời mời kết bạn",
  })
  @Post("request/:fromUserId/cancel")
  async cancelFriendshipRequest(
    @Param("fromUserId", ParseUUIDPipe) fromUserId: string,
    @CurrentUser({ field: "id" }) toUserId: string,
  ) {
    const friendshipRequest =
      await this.prismaService.friendshipRequest.findFirst({
        where: {
          OR: [
            {
              fromUserId,
              toUserId,
            },
            {
              fromUserId: toUserId,
              toUserId: fromUserId,
            },
          ],
          status: FriendshipRequestStatus.PENDING,
        },
      })
    if (friendshipRequest)
      return this.prismaService.friendshipRequest.deleteMany({
        where: {
          OR: [
            {
              fromUserId,
              toUserId,
            },
            {
              fromUserId: toUserId,
              toUserId: fromUserId,
            },
          ],
          status: FriendshipRequestStatus.PENDING,
        },
      })
    throw new BadGatewayException("Friendship request doesn't exist")
  }

  @ApiOperation({
    summary: "Lấy danh sách bạn bè",
  })
  @Get()
  async getFriendshipList(
    @Query() @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.friendship.findMany({
        where: {
          fromUserId: userId,
        },
        select: {
          toUser: {
            select: {
              wsId: true,
              profile: true,
            },
          },
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.friendship.count({
        where: {
          fromUserId: userId,
        },
      }),
    ])
    return {
      data: data.map(({ toUser: { profile, wsId } }) => ({
        profile,
        isOnline: !!wsId,
      })),
      meta: {
        page,
        take,
        total,
      },
    }
  }

  @ApiOperation({
    summary: "Hủy kết bạn",
  })
  @Delete(":friendId")
  async cancelFriendship(
    @Param("friendId", ParseUUIDPipe) friendId: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const friendship = await this.prismaService.friendship.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: friendId,
        },
      },
    })
    if (friendship) {
      await this.prismaService.$transaction([
        this.prismaService.friendship.deleteMany({
          where: {
            OR: [
              {
                fromUserId: userId,
                toUserId: friendId,
              },
              {
                fromUserId: friendId,
                toUserId: userId,
              },
            ],
          },
        }),
        this.prismaService.friendshipRequest.deleteMany({
          where: {
            OR: [
              {
                fromUserId: userId,
                toUserId: friendId,
              },
              {
                fromUserId: friendId,
                toUserId: userId,
              },
            ],
          },
        }),
      ])
      return "Cancel friendship successfully"
    }
    throw new BadGatewayException("Friendship doesn't exist")
  }
}
