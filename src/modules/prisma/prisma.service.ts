import { Injectable, OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
    await this.user.updateMany({
      data: {
        wsId: null,
      },
    })
    await this.directCallChannel.deleteMany()
  }
}
