import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common"
import { StorageService } from "../storage/storage.service"
import { UserGuard } from "../auth/guards/user.guard"
import { FilesInterceptor } from "@nestjs/platform-express"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { SendImageDto } from "./dto/send-image.dto"
import { PrismaService } from "../prisma/prisma.service"
import { MessageGateway } from "./message.gateway"

@Controller("message")
@UseGuards(UserGuard)
export class MessageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prismaSerive: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) {}

  @Post("upload-multiple")
  @UseInterceptors(FilesInterceptor("images"))
  async uploadMultiple(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() data: SendImageDto,
    @CurrentUser({ field: "id" }) id: string,
  ) {
    console.log(id)
    const { channelId } = data
    console.log(channelId)
    const path = "uploads"
    const imageUrls =
      await this.storageService.uploadMutilpleFilesToPublicBucket(path, images)
    const directMessageChannel =
      await this.prismaSerive.directMessageChannel.findUnique({
        where: {
          id: channelId,
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
    console.log(directMessageChannel.users)
    const savedImages = await Promise.all(
      imageUrls.map((imageUrl) =>
        this.prismaSerive.directImage.create({
          data: {
            imageUrl: imageUrl.url,
            imageKey: imageUrl.key,
            directMessageChannelId: channelId,
            userId: id,
          },
        }),
      ),
    )
    console.log(savedImages)
    this.messageGateway.sendImagesMessage(
      directMessageChannel.users,
      savedImages,
    )
  }
}
