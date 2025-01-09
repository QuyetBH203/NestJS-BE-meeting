import { UseGuards } from "@nestjs/common"
import {
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { WsEvent, WsResponse } from "src/types/ws"
import { AuthService } from "../auth/auth.service"
import { WsGuard } from "../auth/guards/ws.guard"
import { PrismaService } from "../prisma/prisma.service"
import { RequestCallDto } from "./dto/request-call.dto"

@UseGuards(WsGuard)
@WebSocketGateway()
export class CallGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  constructor(
    private prismaService: PrismaService,
    private authService: AuthService,
  ) {}

  async handleDisconnect(client: Socket) {
    const user = await this.authService.getUserFromSocket(client)
    if (!user) return
    const directCallChannel =
      await this.prismaService.directCallChannel.findFirst({
        where: {
          users: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          users: {
            select: {
              user: {
                select: {
                  id: true,
                  wsId: true,
                },
              },
            },
          },
        },
      })
    if (!directCallChannel) return
    directCallChannel.users
      .filter((item) => item.user.id !== user.id)
      .forEach((item) => {
        if (item.user.wsId)
          this.server
            .to(item.user.wsId)
            .emit(WsEvent.CANCEL_CALL, directCallChannel)
      })

    await this.prismaService.directCallChannel.delete({
      where: {
        id: directCallChannel.id,
      },
    })
  }

  @SubscribeMessage(WsEvent.REQUEST_CALL)
  async requestCall(
    @MessageBody()
    { toUserId }: RequestCallDto,
    @CurrentUser({ field: "id", isSocket: true }) userId: string,
    @CurrentUser({ field: "wsId", isSocket: true }) userWsId: string,
  ): Promise<WsResponse> {
    const toUser = await this.prismaService.user.findUnique({
      where: {
        id: toUserId,
      },
    })
    if (!toUser)
      return {
        status: "error",
        error: "User doesn't exist",
      }
    if (!toUser.wsId)
      return {
        status: "error",
        error: "User isn't online",
      }

    const [fromDirectCallChannel, toDirectCallChannel] =
      await this.prismaService.$transaction([
        this.prismaService.usersOnDirectCallChannels.findFirst({
          where: {
            userId,
          },
        }),
        this.prismaService.usersOnDirectCallChannels.findFirst({
          where: {
            userId: toUserId,
          },
        }),
      ])
    if (fromDirectCallChannel)
      return {
        status: "error",
        error: "You are on anothor call",
      }
    if (toDirectCallChannel)
      return {
        status: "error",
        error: "User is on anothor call",
      }

    const directCallChannel = await this.prismaService.directCallChannel.create(
      {
        data: {
          createdById: userId,
          users: {
            create: [{ userId }, { userId: toUserId }],
          },
        },
        include: {
          users: {
            select: {
              user: {
                select: {
                  profile: true,
                },
              },
            },
          },
        },
      },
    )
    ;[userWsId, toUser.wsId].forEach((wsId) =>
      this.server.to(wsId).emit(WsEvent.REQUEST_CALL, directCallChannel),
    )
  }

  @SubscribeMessage(WsEvent.ACCEPT_REQUEST_CALL)
  async acceptRequestCall(
    @CurrentUser({ field: "id", isSocket: true }) userId: string,
  ): Promise<WsResponse> {
    const userOnDirectCallChannel =
      await this.prismaService.usersOnDirectCallChannels.findFirst({
        where: {
          userId,
        },
        include: {
          directCallChannel: {
            include: {
              users: {
                select: {
                  user: {
                    select: {
                      wsId: true,
                      profile: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    if (!userOnDirectCallChannel)
      return {
        status: "error",
        error: "You are not on a call",
      }
    if (userOnDirectCallChannel.directCallChannel.createdById === userId)
      return {
        status: "error",
        error: "You are caller",
      }

    userOnDirectCallChannel.directCallChannel.users.forEach((item) => {
      if (item.user.wsId)
        this.server
          .to(item.user.wsId)
          .emit(
            WsEvent.ACCEPT_REQUEST_CALL,
            userOnDirectCallChannel.directCallChannel,
          )
    })
    await this.prismaService.directCallChannel.update({
      where: {
        id: userOnDirectCallChannel.directCallChannel.id,
      },
      data: {
        acceptedAt: new Date().toISOString(),
      },
    })
  }

  @SubscribeMessage(WsEvent.CANCEL_CALL)
  async cancelCall(
    @CurrentUser({ field: "id", isSocket: true }) userId: string,
  ): Promise<WsResponse> {
    const userOnDirectCallChannel =
      await this.prismaService.usersOnDirectCallChannels.findFirst({
        where: {
          userId,
        },
        include: {
          directCallChannel: {
            include: {
              users: {
                select: {
                  user: {
                    select: {
                      id: true,
                      wsId: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    if (!userOnDirectCallChannel)
      return {
        status: "error",
        error: "You are not on a call",
      }

    userOnDirectCallChannel.directCallChannel.users
      .filter((item) => item.user.id !== userId)
      .forEach((item) => {
        if (item.user.wsId)
          this.server
            .to(item.user.wsId)
            .emit(
              WsEvent.CANCEL_CALL,
              userOnDirectCallChannel.directCallChannel,
            )
      })

    await this.prismaService.directCallChannel.delete({
      where: {
        id: userOnDirectCallChannel.directCallChannel.id,
      },
    })
  }
}
