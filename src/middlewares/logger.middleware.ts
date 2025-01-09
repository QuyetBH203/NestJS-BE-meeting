import { Inject, Injectable, NestMiddleware } from "@nestjs/common"
import { NextFunction, Request, Response } from "express"
import * as moment from "moment"
import { WINSTON_MODULE_PROVIDER } from "nest-winston"
import * as signale from "signale"
import { Logger } from "winston"

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private logger: Logger) {}

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now()

    response.on("finish", () => {
      const { url, method, headers } = request
      const { statusCode } = response

      const log = `${moment().format()} ${method} ${url} ${statusCode} - ${
        Date.now() - startedAt
      } ms - ${headers["user-agent"]}`
      this.logger.info(log)

      if (statusCode >= 200 && statusCode < 300) signale.success(log)
      else signale.debug(log)
    })

    response.on("error", (err: Error) => {
      signale.fatal(err)
      this.logger.info(err)
    })

    next()
  }
}
