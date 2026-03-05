import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

/**
 * Audit Logging Interceptor
 * Automatically logs all state-changing operations (POST, PUT, PATCH, DELETE)
 * to the AuditLog table for compliance and debugging purposes
 *
 * Captures:
 * - userId: Who made the change
 * - action: GET, POST, PUT, PATCH, DELETE
 * - entity: Resource type (e.g., 'SubBroker', 'Client')
 * - entityId: ID of the affected resource
 * - oldValue: Previous state (for updates)
 * - newValue: New state
 * - ipAddress: Request IP
 * - userAgent: User agent string
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(private prismaService: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Only log state-changing operations
    const loggableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!loggableMethods.includes(method)) {
      return next.handle();
    }

    const user = request.user as any;
    const userId = user?.id;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('user-agent') || '';

    // Extract entity and ID from URL or body
    const pathSegments = request.path.split('/').filter((s) => s);
    const entity = pathSegments[0] || 'Unknown';
    const entityId = pathSegments[1] || null;

    // Get request body (will be undefined for GET/DELETE without body)
    const requestBody = request.body;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          // Only log if userId exists
          if (userId) {
            await this.prismaService.auditLog.create({
              data: {
                userId,
                action: method,
                entity,
                entityId: entityId || null,
                oldValue: null, // Would need intercepting the DB read for actual old value
                newValue: requestBody ? JSON.stringify(requestBody) : null,
                ipAddress,
                userAgent,
              },
            });
          }
        } catch (error) {
          // Don't fail the request if audit logging fails
          this.logger.error(`Failed to log audit event: ${error.message}`);
        }
      }),
      catchError((error) => {
        // Log failed attempts too
        try {
          if (userId) {
            this.prismaService.auditLog.create({
              data: {
                userId,
                action: `${method}_FAILED`,
                entity,
                entityId: entityId || null,
                oldValue: null,
                newValue: null,
                ipAddress,
                userAgent,
              },
            });
          }
        } catch (logError) {
          this.logger.error(`Failed to log failed audit event: ${logError.message}`);
        }
        throw error;
      }),
    );
  }

  /**
   * Extract client IP from request, considering proxies
   */
  private getClientIp(request: Request): string {
    const xForwardedFor = request.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    return request.ip || 'unknown';
  }
}
