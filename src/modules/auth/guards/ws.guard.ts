import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Socket } from "socket.io"
import { AuthService } from "../auth.service"

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    try {
      const client: Socket = context.switchToWs().getClient()
      const user = await this.authService.getUserFromSocket(client)
      if (user) {
        context.switchToWs().getClient().user = user
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }
}
