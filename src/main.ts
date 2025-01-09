import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import helmet from "helmet"
import { AppModule } from "./app.module"
import { EnvPayload } from "./types/env"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // const configService = app.get(ConfigService<EnvPayload>)
  // const PORT = configService.get("PORT")

  app.enableShutdownHooks()
  app.enableCors()
  app.use(helmet())
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle("idea-meeting-api")
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
  // app.setGlobalPrefix("api/v1/")

  await app.listen(5000)
}
bootstrap()
