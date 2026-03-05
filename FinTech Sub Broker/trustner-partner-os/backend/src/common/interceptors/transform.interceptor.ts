import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Global Transform Interceptor
 * Wraps all successful responses in a consistent format:
 * {
 *   success: true,
 *   data: <response_data>,
 *   meta: {
 *     timestamp: ISO string,
 *     path: request path
 *   }
 * }
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // Skip wrapping for certain endpoints (e.g., file downloads, health checks)
        const path = request.path;
        if (path === '/health' || path.includes('/download') || path.includes('/export')) {
          return data;
        }

        return {
          success: true,
          data: data,
          meta: {
            timestamp: new Date().toISOString(),
            path: path,
          },
        };
      }),
    );
  }
}
