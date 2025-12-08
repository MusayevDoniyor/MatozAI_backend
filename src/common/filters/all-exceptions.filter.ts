import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Prisma } from "@prisma/client";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = "Internal Server Error";

    // Handle NestJS HttpExceptions
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      message = exception.getResponse();
    }
    // Handle Prisma Errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2002": // Unique constraint failed
          httpStatus = HttpStatus.CONFLICT;
          message = "A record with this unique field already exists";
          break;
        case "P2003": // Foreign key constraint failed
          httpStatus = HttpStatus.BAD_REQUEST;
          message = "Invalid reference to a related record";
          break;
        case "P2025": // Record not found
          httpStatus = HttpStatus.NOT_FOUND;
          message = "Record not found";
          break;
        default:
          httpStatus = HttpStatus.BAD_REQUEST;
          message = `Database error: ${exception.message}`;
          break;
      }
    }
    // Handle Prisma Validation Errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = "Invalid data provided to database";
    }

    // Ensure message is always an object or string, normalization
    const responseMessage =
      typeof message === "object" && message !== null
        ? (message as any).message || message
        : message;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message: responseMessage,
    };

    const requestId = request.requestId || "unknown-id";

    // Log the error
    if (httpStatus >= 500) {
      // Critical Server Errors - Log Stack Trace
      const stack = exception instanceof Error ? exception.stack : "";
      this.logger.error(
        `[${requestId}] Critical Error ${httpStatus}: ${JSON.stringify(
          message
        )}`,
        stack
      );
    } else {
      // Client Errors - Log Warning only
      this.logger.warn(
        `[${requestId}] Client Error ${httpStatus}: ${JSON.stringify(message)}`
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
