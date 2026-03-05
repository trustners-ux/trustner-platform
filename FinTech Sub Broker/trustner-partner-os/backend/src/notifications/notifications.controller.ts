import {
  Controller,
  Post,
  Get,
  Delete,
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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, NotificationChannel } from './dto/create-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * Create and send a notification
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.PARTNER_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create and send notification',
    description: 'Create and send a notification to a specific user',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created and sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  /**
   * Send bulk notifications to multiple users
   */
  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.PARTNER_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send bulk notifications',
    description: 'Send the same notification to multiple users',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk notifications sent',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async sendBulk(@Body() sendBulkDto: SendBulkNotificationDto) {
    return this.notificationsService.sendBulk(sendBulkDto);
  }

  /**
   * Get current user's notifications
   */
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my notifications',
    description: 'Retrieve all notifications for the current user with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findUserNotifications(
    @Query() pagination: PaginationDto,
    @Query('isRead') isRead?: string,
    @Query('channel') channel?: NotificationChannel,
    @CurrentUser() user: any,
  ) {
    const filters = {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      channel,
    };

    return this.notificationsService.findUserNotifications(user.id, pagination, filters);
  }

  /**
   * Mark a notification as read
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') notificationId: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(notificationId, user.id);
  }

  /**
   * Mark all notifications as read
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * Get unread notification count
   */
  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Get the number of unread notifications for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved',
  })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  /**
   * Delete a notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification for the current user',
  })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted',
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async delete(@Param('id') notificationId: string, @CurrentUser() user: any) {
    await this.notificationsService.delete(notificationId, user.id);
  }
}
