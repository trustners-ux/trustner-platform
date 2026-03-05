import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';

/**
 * Authentication Service
 * Core authentication and authorization logic
 * - User registration with password hashing
 * - Login with JWT token generation
 * - Token refresh
 * - Password management
 * - Login attempt tracking and account lockout
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  private readonly PASSWORD_HASH_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register new user
   * Creates user with hashed password and assigns role
   */
  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.PASSWORD_HASH_ROUNDS);

    try {
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          phone: dto.phone,
          password: hashedPassword,
          role: dto.role as UserRole,
          subBrokerId: dto.subBrokerId || null,
          clientId: dto.clientId || null,
          isActive: true,
          emailVerified: false,
          lastLoginAt: null,
          loginAttempts: 0,
          lockoutUntil: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      this.logger.log(`User registered successfully: ${user.email}`);

      return {
        message: 'User registered successfully',
        user,
      };
    } catch (error) {
      this.logger.error(`Registration failed for ${dto.email}: ${error.message}`);
      throw new BadRequestException('Failed to register user');
    }
  }

  /**
   * Login with email and password
   * Returns access and refresh tokens
   */
  async login(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${minutesRemaining} minutes`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1;
      let lockoutUntil = null;

      if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000);
        this.logger.warn(`Account locked due to max login attempts: ${email}`);
      }

      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockoutUntil,
        },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Reset login attempts on successful login
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '3600s',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '604800s',
    });

    this.logger.log(`User logged in successfully: ${email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const newAccessToken = this.jwtService.sign(
        {
          id: payload.id,
          email: payload.email,
          role: payload.role,
        },
        {
          expiresIn: process.env.JWT_ACCESS_EXPIRY || '3600s',
        },
      );

      this.logger.log(`Token refreshed for user: ${payload.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.PASSWORD_HASH_ROUNDS);

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    this.logger.log(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Validate user from JWT payload
   */
  async validateUser(payload: any) {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subBrokerId: user.subBrokerId,
      clientId: user.clientId,
    };
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(userId: string, sessionId?: string) {
    // In a real implementation, you might:
    // - Add token to a blacklist in Redis
    // - Invalidate user sessions in database
    // - Update user's lastLogoutAt timestamp

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: null,
      },
    });

    this.logger.log(`User logged out: ${userId}`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Get user by ID (for internal use)
   */
  async getUserById(userId: string) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }
}
