import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { Prisma } from "@prisma/client"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { PaginationDto } from "src/dto/pagination.dto"
import { UserGuard } from "src/modules/auth/guards/user.guard"
import { PrismaService } from "../../prisma/prisma.service"

@ApiTags("Direct message channel")
@ApiBearerAuth()
@UseGuards(UserGuard)
@Controller("direct-message-channel")
export class DirectMessageChannelController {
  constructor(private prismaService: PrismaService) {}

  @ApiOperation({
    summary: "Lấy danh sách kênh chat gần đây",
  })
  @Get()
  async getDirectMessageChannelList(
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const where: Prisma.DirectMessageChannelWhereInput = {
      users: {
        some: {
          userId,
        },
      },
      NOT: {
        messages: {
          none: {},
        },
      },
    }

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.directMessageChannel.findMany({
        where,
        include: {
          users: {
            where: {
              userId: {
                not: userId,
              },
            },
            select: {
              user: {
                select: {
                  wsId: true,
                  profile: true,
                },
              },
            },
          },
          messages: {
            include: {
              user: {
                select: {
                  profile: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.directMessageChannel.count({ where }),
    ])
    return {
      data: data.map(({ messages, ...item }) => {
        const user = item.users[0].user
        delete item.users
        return {
          ...item,
          user: {
            profile: user.profile,
            isOnline: !!user.wsId,
          },
          lastMessage: messages.length
            ? {
                ...messages[0],
                value: messages[0].isDeleted ? "" : messages[0].value,
              }
            : null,
        }
      }),
      meta: {
        total,
        page,
        take,
      },
    }
  }

  @ApiOperation({
    summary: "Lấy danh sách tin nhắn trong kênh chat",
  })
  @Get(":directMessageChannelId/message")
  async getDirectMessageList(
    @Param("directMessageChannelId", ParseUUIDPipe)
    directMessageChannelId: string,
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const directMessageChannel =
      await this.prismaService.usersOnDirectMessageChannels.findUnique({
        where: {
          userId_directMessageChannelId: {
            userId,
            directMessageChannelId,
          },
        },
      })
    if (!directMessageChannel)
      throw new BadRequestException(
        "Direct message channel doesn't exist or you don't have permission",
      )

    const where: Prisma.DirectMessageWhereInput = {
      directMessageChannelId,
    }
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.directMessage.findMany({
        where,
        include: {
          user: {
            select: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.directMessage.count({
        where,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ])
    return {
      data: data.map((item) => ({
        ...item,
        value: item.isDeleted ? "" : item.value,
      })),
      meta: {
        total,
        page,
        take,
      },
    }
  }
}
