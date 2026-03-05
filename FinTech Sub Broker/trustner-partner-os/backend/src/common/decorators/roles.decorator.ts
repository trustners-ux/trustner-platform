import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Custom decorator to specify required roles for a route handler
 * Usage: @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
