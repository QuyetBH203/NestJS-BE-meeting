import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import helmet from "helmet"
import { AppModule } from "./app.module"
import * as fs from "fs"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: fs.readFileSync("../../../private_key.pem"),
      cert: fs.readFileSync("../../../public_key.pem"),
    },
  })
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
