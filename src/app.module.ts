import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common"
import { AppGateway } from "./app.gateway"
import { LoggerMiddleware } from "./middlewares/logger.middleware"
import { AuthModule } from "./modules/auth/auth.module"
import { CallModule } from "./modules/call/call.module"
import { FriendModule } from "./modules/friend/friend.module"
import { GroupModule } from "./modules/group/group.module"
import { MessageChannelModule } from "./modules/message-channel/message-channel.module"
import { MessageModule } from "./modules/message/message.module"
import { SharedModule } from "./modules/shared/shared.module"
import { UploadModule } from "./modules/upload/upload.module"
import { UserModule } from "./modules/user/user.module"
import { ConfigModule } from "@nestjs/config"

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UserModule,
    GroupModule,
    FriendModule,
    MessageModule,
    MessageChannelModule,
    MessageChannel,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CallModule,
    UploadModule,
  ],
  providers: [AppGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*")
  }
}

// "start": "env-cmd -f .env.prod node dist/main",
