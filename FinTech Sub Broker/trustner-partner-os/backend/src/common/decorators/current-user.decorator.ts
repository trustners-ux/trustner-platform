import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract current user from request
 * Usage: @CurrentUser() user: CurrentUserType
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

/**
 * Type for current user object
 */
export interface CurrentUserType {
  id: string;
  email: string;
  role: string;
  subBrokerId?: string;
  clientId?: string;
}
