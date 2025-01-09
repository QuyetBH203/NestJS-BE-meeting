import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { Prisma } from "@prisma/client"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { PaginationDto } from "src/dto/pagination.dto"
import { UserGuard } from "src/modules/auth/guards/user.guard"
import { PrismaService } from "src/modules/prisma/prisma.service"
import { CreateGroupMessageChannelDto } from "../dto/create-group-message-channel.dto"
import { UpdateGroupMessageChannelDto } from "../dto/update-group-message-channel.dto"

@ApiTags("Group message channel")
@ApiBearerAuth()
@UseGuards(UserGuard)
@Controller("group-message-channel")
export class GroupMessageChannelController {
  constructor(private prismaService: PrismaService) {}

  @ApiOperation({
    summary: "Tạo kênh chat nhóm",
  })
  @Post(":groupId")
  async createGroupMessageChannel(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Body() { name }: CreateGroupMessageChannelDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
      },
    })
    if (!group || group.ownerId !== userId)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    return this.prismaService.groupMessageChannel.create({
      data: {
        groupId,
        name,
      },
    })
  }

  @ApiOperation({
    summary: "Lấy danh sách kênh chat nhóm",
  })
  @Get(":groupId")
  async getGroupMessageChannelList(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })
    if (!group)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    const where: Prisma.GroupMessageChannelWhereInput = {
      groupId,
      isDeleted: false,
    }
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.groupMessageChannel.findMany({
        where,
        include: {
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
          name: "desc",
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.groupMessageChannel.count({ where }),
    ])
    return {
      data: data.map(({ messages, ...item }) => ({
        ...item,
        lastMessage: messages.length
          ? {
              ...messages[0],
              value: messages[0].isDeleted ? "" : messages[0].value,
            }
          : null,
      })),
      meta: {
        total,
        page,
        take,
      },
    }
  }

  @ApiOperation({
    summary: "Lấy thông tin kênh chat nhóm",
  })
  @Get(":groupId/:groupMessageChannelId")
  async getGroupMessageChannel(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("groupMessageChannelId", ParseUUIDPipe)
    groupMessageChannelId: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })
    if (!group)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    const groupMessageChannel =
      await this.prismaService.groupMessageChannel.findUnique({
        where: {
          id: groupMessageChannelId,
          groupId,
        },
      })
    if (!groupMessageChannel)
      throw new BadRequestException(
        "Group message channel doesn't exist or you don't have permission",
      )
    return groupMessageChannel
  }

  @ApiOperation({
    summary: "Cập nhật thông tin kênh chat nhóm",
  })
  @Patch(":groupId/:groupMessageChannelId")
  async updateGroupMessageChannel(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("groupMessageChannelId", ParseUUIDPipe)
    groupMessageChannelId: string,
    @Body() data: UpdateGroupMessageChannelDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })
    if (!group || !group.isOwner)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    const groupMessageChannel =
      await this.prismaService.groupMessageChannel.findUnique({
        where: {
          id: groupMessageChannelId,
        },
      })
    if (!groupMessageChannel)
      throw new BadRequestException(
        "Group message channel doesn't exist or you don't have permission",
      )
    return this.prismaService.groupMessageChannel.update({
      where: {
        id: groupMessageChannelId,
      },
      data,
    })
  }

  @ApiOperation({
    summary: "Xóa kênh chat nhóm",
  })
  @Delete(":groupId/:groupMessageChannelId")
  async deleteGroupMessageChannel(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("groupMessageChannelId", ParseUUIDPipe)
    groupMessageChannelId: string,

    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })
    if (!group || !group.isOwner)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    const groupMessageChannel =
      await this.prismaService.groupMessageChannel.findUnique({
        where: {
          id: groupMessageChannelId,
        },
      })
    if (!groupMessageChannel)
      throw new BadRequestException(
        "Group message channel doesn't exist or you don't have permission",
      )
    return this.prismaService.groupMessageChannel.update({
      where: {
        id: groupMessageChannelId,
      },
      data: {
        isDeleted: true,
      },
    })
  }

  @ApiOperation({
    summary: "Lấy danh sách tin nhắn trong kênh chat nhóm",
  })
  @Get(":groupId/:groupMessageChannelId/message")
  async getGroupMessageList(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("groupMessageChannelId", ParseUUIDPipe)
    groupMessageChannelId: string,
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })
    if (!group)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    const groupMessageChannel =
      await this.prismaService.groupMessageChannel.findUnique({
        where: {
          id: groupMessageChannelId,
          groupId,
        },
      })
    if (!groupMessageChannel)
      throw new BadRequestException(
        "Group message channel doesn't exist or you don't have permission",
      )

    const where: Prisma.GroupMessageWhereInput = {
      groupMessageChannelId,
    }
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.groupMessage.findMany({
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
      this.prismaService.groupMessage.count({
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
