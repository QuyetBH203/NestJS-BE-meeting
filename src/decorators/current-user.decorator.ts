import { ExecutionContext, createParamDecorator } from "@nestjs/common"
import { User } from "@prisma/client"

interface CurrentUserArgs {
  field?: keyof User
  isSocket?: boolean
}

export const CurrentUser = createParamDecorator(
  (args: CurrentUserArgs, context: ExecutionContext) => {
    const user = args?.isSocket
      ? context.switchToWs().getClient().user
      : context.switchToHttp().getRequest().user
    return args?.field ? user[args.field] : user
  },
)
