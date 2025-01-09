import { BadRequestException, UseGuards } from "@nestjs/common"
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { Server } from "socket.io"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { WsEvent } from "src/types/ws"
import { WsGuard } from "../auth/guards/ws.guard"
import { PrismaService } from "../prisma/prisma.service"
import {
  CreateDirectMessageDto,
  CreateGroupMessageDto,
} from "./dto/create-message.dto"
import {
  DeleteDirectMessageDto,
  DeleteGroupMessageDto,
} from "./dto/delete-message.dto"

@UseGuards(WsGuard)
@WebSocketGateway()
export class MessageGateway {
  @WebSocketServer()
  server: Server

  constructor(private prismaSerive: PrismaService) {}

  @SubscribeMessage(WsEvent.CREATE_DIRECT_MESSAGE)
  async createDirectMessage(
    @MessageBody()
    { directMessageChannelId, type, value }: CreateDirectMessageDto,
    @CurrentUser({ field: "id", isSocket: true }) userId: string,
  ) {
    const directMessageChannel =
      await this.prismaSerive.directMessageChannel.findUnique({
        where: {
          id: directMessageChannelId,
        },
        include: {
          users: {
            select: {
              user: {
                select: {
                  wsId: true,
                },
              },
            },
          },
        },
      })
    if (!directMessageChannel)
      throw new BadRequestException(
        "Direct message channel doesn't exist or you don't have permission",
      )

    const [directMessage] = await this.prismaSerive.$transaction([
      this.prismaSerive.directMessage.create({
        data: {
          directMessageChannelId,
          userId,
          type,
          value,
        },
      }),
      this.prismaSerive.directMessageChannel.update({
        where: {
          id: directMessageChannelId,
        },
        data: {
          updatedAt: new Date().toISOString(),
        },
      }),
    ])
    directMessageChannel.users.forEach(
      ({ user: { wsId } }) =>
        wsId &&
        this.server.to(wsId).emit(WsEvent.CREATE_DIRECT_MESSAGE, directMessage),
    )
  }

  @SubscribeMessage(WsEvent.CREATE_GROUP_MESSAGE)
  async createGroupMessage(
    @MessageBody()
    { groupMessageChannelId, type, value }: CreateGroupMessageDto,
    @CurrentUser({ field: "id", isSocket: true }) userId: string,
  ) {
    const groupMessageChannel =
      await this.prismaSerive.groupMessageChannel.findUnique({
        where: {
          id: groupMessageChannelId,
        },
      })
    if (!groupMessageChannel)
      throw new BadRequestException(
        "Group message channel doesn't exist or you don't have permission",
      )

    const group = await this.prismaSerive.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: groupMessageChannel.groupId,
        },
      },
      include: {
        group: {
          select: {
            users: {
              select: {
                user: {
                  select: { wsId: true, profile: true },
                },
              },
            },
          },
        },
      },
    })
    if (!group)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )

    const groupMessage = await this.prismaSerive.groupMessage.create({
      data: {
        groupMessageChannelId,
        userId,
        type,
        value,
      },
      include: {
        user: {
          select: {
            profile: true,
          },
        },
      },
    })
    group.group.users.forEach(
      ({ user: { wsId } }) =>
        wsId &&
        this.server.to(wsId).emit(WsEvent.CREATE_GROUP_MESSAGE, groupMessage),
    )
  }

  @SubscribeMessage(WsEvent.DELETE_DIRECT_MESSAGE)
  async deleteDirectMessage(
    @MessageBody()
    { directMessageId }: DeleteDirectMessageDto,
    @CurrentUser({ field: "id", isSocket: true }) userId: string,
  ) {
    const directMessage = await this.prismaSerive.directMessage.findUnique({
      where: {
        id: directMessageId,
        userId,
        isDeleted: false,
      },
    })
    if (!directMessage)
      throw new BadRequestException(
        "Direct message doesn't exist or you don't have permission",
      )

    const [directMessageChannel] = await this.prismaSerive.$transaction([
      this.prismaSerive.directMessageChannel.findUnique({
        where: {
          id: directMessage.directMessageChannelId,
        },
        select: {
          users: {
            select: {
              user: {
                select: {
                  wsId: true,
                },
              },
            },
          },
        },
      }),
      this.prismaSerive.directMessage.update({
        where: {
          id: directMessageId,
        },
        data: {
          isDeleted: true,
        },
      }),
    ])
    directMessageChannel.users.forEach(
      ({ user: { wsId } }) =>
        wsId &&
        this.server.to(wsId).emit(WsEvent.DELETE_DIRECT_MESSAGE, {
          directMessageChannelId: directMessage.directMessageChannelId,
          directMessageId,
        }),
    )
  }

  @SubscribeMessage(WsEvent.DELETE_GROUP_MESSAGE)
  async deleteGroupMessage(
    @MessageBody()
    { groupMessageId }: DeleteGroupMessageDto,
    @CurrentUser({ field: "id", isSocket: true }) userId: string,
  ) {
    const groupMessage = await this.prismaSerive.groupMessage.findUnique({
      where: {
        id: groupMessageId,
        userId,
        isDeleted: false,
      },
      include: {
        groupMessageChannel: true,
      },
    })
    if (!groupMessage)
      throw new BadRequestException(
        "Group message doesn't exist or you don't have permission",
      )

    const [group] = await this.prismaSerive.$transaction([
      this.prismaSerive.group.findUnique({
        where: {
          id: groupMessage.groupMessageChannel.groupId,
        },
        select: {
          users: {
            select: {
              user: {
                select: {
                  wsId: true,
                },
              },
            },
          },
        },
      }),
      this.prismaSerive.groupMessage.update({
        where: {
          id: groupMessageId,
        },
        data: {
          isDeleted: true,
        },
      }),
    ])
    group.users.forEach(
      ({ user: { wsId } }) =>
        wsId &&
        this.server.to(wsId).emit(WsEvent.DELETE_GROUP_MESSAGE, {
          groupMessageChannelId: groupMessage.groupMessageChannelId,
          groupMessageId,
        }),
    )
  }
}
