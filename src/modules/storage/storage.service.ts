import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { EnvPayload } from "src/types/env"
import { UploadFileServiceAbstract } from "./UploadFileServiceAbstract"

@Injectable()
export class StorageService implements UploadFileServiceAbstract {
  private s3_client: S3Client

  constructor(private readonly config_service: ConfigService<EnvPayload>) {
    this.s3_client = new S3Client({
      region: config_service.get("AWS_S3_REGION"),
      credentials: {
        accessKeyId: config_service.get("AWS_ACCESS_KEY_ID"),
        secretAccessKey: config_service.get("AWS_ACCESS_KEY_SECRECT"),
      },
    })
  }
  async uploadFileToPublicBucket(
    path: string,
    { file, file_name }: { file: Express.Multer.File; file_name: string },
  ) {
    const bucket_name = this.config_service.get("AWS_S3_PUBLIC_BUCKET")
    const key = `${path}/${Date.now().toString()}-${file_name}`
    await this.s3_client.send(
      new PutObjectCommand({
        Bucket: bucket_name,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
        ContentLength: file.size,
      }),
    )

    return {
      url: `https://${bucket_name}.s3.amazonaws.com/${key}`,
      key: key,
    }
  }
  async deleteFileFromPublicBucket(key: string): Promise<any> {
    const response = await this.s3_client.send(
      new DeleteObjectCommand({
        Bucket: this.config_service.get("AWS_S3_PUBLIC_BUCKET"),
        Key: key,
      }),
    )
    return response
  }
}
