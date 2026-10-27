import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Произошла внутренняя ошибка сервера';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, any>;
        if (errorObj.code) {
          code = errorObj.code;
        } else {
          code = this.getDefaultCodeForStatus(status);
        }

        if (Array.isArray(errorObj.message)) {
          message = errorObj.message.join(', ');
          code = 'VALIDATION_ERROR';
        } else if (errorObj.message) {
          message = errorObj.message;
        }
      } else if (typeof res === 'string') {
        message = res;
        code = this.getDefaultCodeForStatus(status);
      }
    } else {
      this.logger.error('Unhandled exception:', exception);
    }

    response.status(status).json({
      code,
      message,
    });
  }

  private getDefaultCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'ERROR';
    }
  }
}
