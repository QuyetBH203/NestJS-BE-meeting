import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common"
import { StorageService } from "./storage.service"
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express"
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

  @Post("upload-large")
  @UseInterceptors(FileInterceptor("image"))
  async uploadLargeImage(
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File,
  ) {
    const path = "uploads"
    const file_name = image.originalname

    return await this.storageService.uploadLargeFileToPublicBucket(path, {
      file: image,
      file_name,
    })
  }

  @Post("upload-multiple")
  @UseInterceptors(FilesInterceptor("images"))
  async uploadMultiple(@UploadedFiles() images: Express.Multer.File[]) {
    const path = "uploads"
    return this.storageService.uploadMutilpleFilesToPublicBucket(path, images)
  }
}
