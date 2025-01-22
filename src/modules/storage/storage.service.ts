import { BadRequestException, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { EnvPayload } from "src/types/env"
import { UploadFileServiceAbstract } from "./UploadFileServiceAbstract"
import { Upload } from "@aws-sdk/lib-storage"

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

  async uploadLargeFileToPublicBucket(
    path: string,
    { file, file_name }: { file: Express.Multer.File; file_name: string },
  ) {
    const bucket_name = this.config_service.get("AWS_S3_PUBLIC_BUCKET")
    const key = `${path}/${Date.now().toString()}-${file_name}`

    const parallelUploads3 = new Upload({
      client: this.s3_client,
      params: {
        Bucket: bucket_name,
        Key: key,
        Body: Buffer.from(file.buffer),
        ACL: "public-read",
        ContentType: file.mimetype,
      },
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    })

    parallelUploads3.on("httpUploadProgress", (progress) => {
      console.log({ progress })
    })

    await parallelUploads3.done()

    return {
      url: `https://${bucket_name}.s3.amazonaws.com/${key}`,
      key,
    }
  }

  async uploadMutilpleFilesToPublicBucket(
    path: string,
    files: Express.Multer.File[],
  ) {
    const maxFiles = 5
    if (files.length > maxFiles) {
      throw new BadRequestException("You can only upload 5 image", {
        cause: new Error(),
        description: "Some error description",
      })
    }
    const uploadPromises = files.map((file, index) => {
      const file_name = `image-${index + 1}-${file.originalname}`
      return this.uploadFileToPublicBucket(path, { file, file_name })
    })

    const uploadResults = await Promise.all(uploadPromises)

    return uploadResults
  }
}
