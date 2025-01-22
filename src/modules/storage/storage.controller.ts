import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { StorageService } from "./storage.service"
import { FileInterceptor } from "@nestjs/platform-express"
import { ImageValidationPipe } from "src/pipe/image.pipe"
import { ProfileDto } from "./dto/profile.dto"

@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("image"))
  async uploadImage(
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File,
  ) {
    const path = "uploads"
    const file_name = image.originalname

    return await this.storageService.uploadFileToPublicBucket(path, {
      file: image,
      file_name,
    })
  }

  @Post("delete")
  async deleteImage(@Body() body: ProfileDto) {
    console.log(body)
    return await this.storageService.deleteFileFromPublicBucket(body.code)
  }
}
