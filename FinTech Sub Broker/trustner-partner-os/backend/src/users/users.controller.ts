import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Get all users with pagination and filters
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description: 'List all users with pagination and optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    return this.usersService.findAll(pagination, filters);
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Get user details',
    description: 'Retrieve detailed information for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Update user account information
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update user information',
    description: 'Update user profile and account settings',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateDto);
  }

  /**
   * Deactivate user account
   */
  @Post(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate user',
    description: 'Deactivate a user account and terminate all sessions',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * Activate user account
   */
  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate user',
    description: 'Activate a deactivated user account',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  /**
   * Get user profile
   */
  @Get(':id/profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  /**
   * Update user profile
   */
  @Patch(':id/profile')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    // Users can only update their own profile unless they're admin
    if (
      currentUser.id !== id &&
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.COMPLIANCE_ADMIN
    ) {
      throw new Error('Unauthorized');
    }

    return this.usersService.updateProfile(id, updateDto);
  }

  /**
   * Get user active sessions
   */
  @Get(':id/sessions')
  @ApiOperation({
    summary: 'Get user sessions',
    description: 'Retrieve active sessions for a user',
  })
  @ApiResponse({
    status: 200,
    description: 'User sessions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getActiveSessions(@Param('id') id: string, @CurrentUser() currentUser: any) {
    // Users can only view their own sessions unless they're admin
    if (
      currentUser.id !== id &&
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.COMPLIANCE_ADMIN
    ) {
      throw new Error('Unauthorized');
    }

    return this.usersService.getActiveSessions(id);
  }

  /**
   * Terminate a specific session
   */
  @Post(':id/sessions/:sessionId/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminate session',
    description: 'Terminate a specific user session',
  })
  @ApiResponse({
    status: 200,
    description: 'Session terminated successfully',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async terminateSession(
    @Param('id') userId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: any,
  ) {
    // Users can only terminate their own sessions unless they're admin
    if (
      currentUser.id !== userId &&
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.COMPLIANCE_ADMIN
    ) {
      throw new Error('Unauthorized');
    }

    return this.usersService.terminateSession(userId, sessionId);
  }
}
