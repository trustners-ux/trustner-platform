import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

/**
 * Users Service
 * Manages user accounts, profiles, sessions, and account lifecycle
 * - User registration and activation
 * - Profile management
 * - Session tracking
 * - Account deactivation/activation
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Get all users with pagination and filters
   */
  async findAll(
    pagination: PaginationDto,
    filters?: {
      role?: UserRole;
      isActive?: boolean;
      search?: string;
    },
  ) {
    const where: Prisma.UserWhereInput = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    this.logger.log(`Retrieved ${data.length} users from ${total} total`);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get user by ID with profile details
   */
  async findOne(id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        failedAttempts: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        sessions: {
          select: {
            id: true,
            expiresAt: true,
            createdAt: true,
            deviceInfo: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Update user account information
   */
  async update(id: string, updateDto: UpdateUserDto) {
    const user = await this.findOne(id);

    const dateOfBirth = updateDto.dateOfBirth
      ? new Date(updateDto.dateOfBirth)
      : undefined;

    try {
      const updatedUser = await this.prismaService.user.update({
        where: { id },
        data: {
          twoFactorEnabled: updateDto.twoFactorEnabled,
          profile: {
            upsert: {
              create: {
                firstName: updateDto.firstName || '',
                lastName: updateDto.lastName || '',
                displayName: updateDto.displayName,
                dateOfBirth,
                gender: updateDto.gender,
                avatarUrl: updateDto.avatarUrl,
                addressLine1: updateDto.addressLine1,
                addressLine2: updateDto.addressLine2,
                city: updateDto.city,
                state: updateDto.state,
                pincode: updateDto.pincode,
              },
              update: {
                firstName: updateDto.firstName,
                lastName: updateDto.lastName,
                displayName: updateDto.displayName,
                dateOfBirth,
                gender: updateDto.gender,
                avatarUrl: updateDto.avatarUrl,
                addressLine1: updateDto.addressLine1,
                addressLine2: updateDto.addressLine2,
                city: updateDto.city,
                state: updateDto.state,
                pincode: updateDto.pincode,
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          profile: true,
          updatedAt: true,
        },
      });

      this.logger.log(`User updated: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Deactivate user account
   */
  async deactivate(id: string) {
    const user = await this.findOne(id);

    if (!user.isActive) {
      throw new BadRequestException('User is already deactivated');
    }

    try {
      await this.prismaService.userSession.deleteMany({
        where: { userId: id },
      });

      const deactivatedUser = await this.prismaService.user.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          isActive: true,
          updatedAt: true,
        },
      });

      this.logger.log(`User deactivated: ${id}`);
      return deactivatedUser;
    } catch (error) {
      this.logger.error(`Failed to deactivate user ${id}: ${error.message}`);
      throw new BadRequestException('Failed to deactivate user');
    }
  }

  /**
   * Activate user account
   */
  async activate(id: string) {
    const user = await this.findOne(id);

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    try {
      const activatedUser = await this.prismaService.user.update({
        where: { id },
        data: {
          isActive: true,
          failedAttempts: 0,
          lockedUntil: null,
        },
        select: {
          id: true,
          email: true,
          isActive: true,
          updatedAt: true,
        },
      });

      this.logger.log(`User activated: ${id}`);
      return activatedUser;
    } catch (error) {
      this.logger.error(`Failed to activate user ${id}: ${error.message}`);
      throw new BadRequestException('Failed to activate user');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const profile = await this.prismaService.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateDto: UpdateUserDto) {
    await this.findOne(userId);

    const dateOfBirth = updateDto.dateOfBirth
      ? new Date(updateDto.dateOfBirth)
      : undefined;

    try {
      const updatedProfile = await this.prismaService.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          firstName: updateDto.firstName || '',
          lastName: updateDto.lastName || '',
          displayName: updateDto.displayName,
          dateOfBirth,
          gender: updateDto.gender,
          avatarUrl: updateDto.avatarUrl,
          addressLine1: updateDto.addressLine1,
          addressLine2: updateDto.addressLine2,
          city: updateDto.city,
          state: updateDto.state,
          pincode: updateDto.pincode,
        },
        update: {
          firstName: updateDto.firstName,
          lastName: updateDto.lastName,
          displayName: updateDto.displayName,
          dateOfBirth,
          gender: updateDto.gender,
          avatarUrl: updateDto.avatarUrl,
          addressLine1: updateDto.addressLine1,
          addressLine2: updateDto.addressLine2,
          city: updateDto.city,
          state: updateDto.state,
          pincode: updateDto.pincode,
        },
      });

      this.logger.log(`Profile updated for user: ${userId}`);
      return updatedProfile;
    } catch (error) {
      this.logger.error(`Failed to update profile for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to update profile');
    }
  }

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string) {
    await this.findOne(userId);

    const sessions = await this.prismaService.userSession.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Retrieved ${sessions.length} active sessions for user: ${userId}`);

    return sessions;
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(userId: string, sessionId: string) {
    const session = await this.prismaService.userSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    try {
      await this.prismaService.userSession.delete({
        where: { id: sessionId },
      });

      this.logger.log(`Session terminated: ${sessionId} for user: ${userId}`);
      return { success: true, message: 'Session terminated successfully' };
    } catch (error) {
      this.logger.error(`Failed to terminate session ${sessionId}: ${error.message}`);
      throw new BadRequestException('Failed to terminate session');
    }
  }
}
