import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * Users Module
 * Manages user accounts, profiles, sessions, and account lifecycle
 * - User registration and activation
 * - Profile management
 * - Session tracking and termination
 * - Account deactivation/activation
 */
@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
