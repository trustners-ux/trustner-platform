import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global HTTP Exception Filter
 * Formats all exceptions into consistent JSON response structure
 * Logs detailed error information for debugging
 */
@Catch(HttpException, BadRequestException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let details: any = null;

    // Handle validation errors
    if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object') {
      const errorObj = exceptionResponse as any;
      if (Array.isArray(errorObj.message)) {
        // class-validator errors
        message = 'Validation failed';
        details = errorObj.message;
      } else {
        message = errorObj.message || 'Bad request';
      }
    } else if (typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || 'Internal server error';
    } else {
      message = exceptionResponse.toString();
    }

    // Log error for monitoring and debugging
    const logMessage = `[${request.method}] ${request.url} - ${status} - ${message}`;
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    }

    // Format response
    const errorResponse = {
      success: false,
      error: {
        code: status,
        message: message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
