import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params, ip } = request;

    // Generate Request ID
    const requestId = request.headers["x-request-id"] || uuidv4();
    request.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);

    const userAgent = request.get("user-agent") || "";
    const start = Date.now();

    // Sanitize body for logging
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = "***";
    if (sanitizedBody.token) sanitizedBody.token = "***";
    if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = "***";

    this.logger.log(
      `[${requestId}] Incoming Request: ${method} ${url} | IP: ${ip} | User-Agent: ${userAgent} | Body: ${JSON.stringify(
        sanitizedBody
      )}`
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - start;
          const statusCode = response.statusCode;
          this.logger.log(
            `[${requestId}] Response: ${method} ${url} ${statusCode} +${duration}ms`
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          const statusCode = error.status || 500;
          this.logger.error(
            `[${requestId}] Error Response: ${method} ${url} ${statusCode} +${duration}ms - ${error.message}`,
            error.stack
          );
        },
      })
    );
  }
}
