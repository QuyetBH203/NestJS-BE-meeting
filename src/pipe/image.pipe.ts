import {
  PipeTransform,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common"

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  constructor(private readonly fieldName: string = "image") {}
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new UnprocessableEntityException([`${this.fieldName} is required`])
    }
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      throw new UnprocessableEntityException([
        `Invalid ${this.fieldName} file type. Only JPEG and PNG are allowed`,
      ])
    }
    return file
  }
}
