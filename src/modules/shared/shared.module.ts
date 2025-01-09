import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { JwtModule } from "@nestjs/jwt"
import * as Joi from "joi"
import { WinstonModule } from "nest-winston"
import { EnvPayload } from "src/types/env"
import * as DailyRotateFile from "winston-daily-rotate-file"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object<EnvPayload, true>({
        PORT: Joi.number().required(),

        DB_URL: Joi.string().required(),

        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRE: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRE: Joi.string().required(),

        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),

        CLOUDINARY_NAME: Joi.string().required(),
        CLOUDINARY_FOLDER: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
      }),
    }),
    PrismaModule,
    WinstonModule.forRoot({
      transports: [
        new DailyRotateFile({
          dirname: process.cwd() + "/logs",
          filename: "%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
        }),
      ],
    }),
    JwtModule.register({
      global: true,
    }),
  ],
})
export class SharedModule {}
