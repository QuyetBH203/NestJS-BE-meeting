import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger"
import { extname } from "path"
import { cloudinaryStorage } from "src/utils/cloudinaryStorage"

@ApiTags("Upload")
@ApiBearerAuth()
@Controller("upload")
export class UploadController {
  @ApiOperation({
    summary: "Upload hình ảnh",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        files: 1,
        fieldSize: 5 * 1000 * 1000,
      },
      fileFilter(req, file, callback) {
        if (
          !["png", "jpg", "jpeg"].includes(extname(file.originalname).slice(1))
        )
          throw new BadRequestException("Only images are allowed")
        callback(null, true)
      },
      storage: cloudinaryStorage,
    }),
  )
  @Post("image")
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return file.path
  }
}
