import { Module } from "@nestjs/common"
import { UserController } from "./user.controller"
import { StorageService } from "../storage/storage.service"

@Module({
  controllers: [UserController],
  providers: [StorageService],
})
export class UserModule {}
