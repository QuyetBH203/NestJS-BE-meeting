import { UseGuards } from "@nestjs/common"
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from "@nestjs/websockets"
import { Socket } from "socket.io"
import { AuthService } from "./modules/auth/auth.service"
import { WsGuard } from "./modules/auth/guards/ws.guard"
import { PrismaService } from "./modules/prisma/prisma.service"

@UseGuards(WsGuard)
@WebSocketGateway({
  cors: true,
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private prismaService: PrismaService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const user = await this.authService.getUserFromSocket(client)
    if (user)
      await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          wsId: client.id,
        },
      })
    else client.disconnect()
  }

  async handleDisconnect(client: Socket) {
    const user = await this.authService.getUserFromSocket(client)
    if (user)
      await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          wsId: null,
        },
      })
  }
}
