import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationChannel } from './dto/create-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

/**
 * Notifications Service
 * Manages user notifications across multiple channels
 * - Create and send individual notifications
 * - Send bulk notifications to multiple users
 * - Track notification read status
 * - Support multiple channels: IN_APP, SMS, EMAIL, WHATSAPP, PUSH
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Create and send a single notification
   */
  async create(createDto: CreateNotificationDto): Promise<any> {
    try {
      // Verify user exists
      const user = await this.prismaService.user.findUnique({
        where: { id: createDto.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${createDto.userId} not found`);
      }

      const notification = await this.prismaService.notification.create({
        data: {
          userId: createDto.userId,
          title: createDto.title,
          body: createDto.body,
          channel: createDto.channel || NotificationChannel.IN_APP,
          actionUrl: createDto.actionUrl || null,
          metadata: createDto.metadata || null,
          sentAt: new Date(),
        },
      });

      // Send via external channels if specified
      if (createDto.channel !== NotificationChannel.IN_APP) {
        await this.sendViaChannel(user, createDto, notification.id);
      }

      this.logger.log(`Notification created: ${notification.id} for user ${createDto.userId}`);

      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulk(sendBulkDto: SendBulkNotificationDto): Promise<{ sent: number; failed: number; errors: any[] }> {
    this.logger.log(`Sending bulk notification to ${sendBulkDto.userIds.length} users`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Create notifications in parallel
    const notificationPromises = sendBulkDto.userIds.map(async (userId) => {
      try {
        const user = await this.prismaService.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          results.failed++;
          results.errors.push({ userId, error: 'User not found' });
          return;
        }

        const notification = await this.prismaService.notification.create({
          data: {
            userId,
            title: sendBulkDto.title,
            body: sendBulkDto.body,
            channel: sendBulkDto.channel || NotificationChannel.IN_APP,
            actionUrl: sendBulkDto.actionUrl || null,
            metadata: sendBulkDto.metadata || null,
            sentAt: new Date(),
          },
        });

        // Send via external channels if specified
        if (sendBulkDto.channel !== NotificationChannel.IN_APP) {
          await this.sendViaChannel(user, sendBulkDto as CreateNotificationDto, notification.id);
        }

        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
    });

    await Promise.all(notificationPromises);

    this.logger.log(
      `Bulk notification sent: ${results.sent} successful, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Get notifications for a user with filters and pagination
   */
  async findUserNotifications(
    userId: string,
    pagination: PaginationDto,
    filters?: { isRead?: boolean; channel?: NotificationChannel },
  ): Promise<{ data: any[]; total: number; page: number; limit: number; pages: number }> {
    try {
      const where: any = { userId };

      if (filters?.isRead !== undefined) {
        where.isRead = filters.isRead;
      }

      if (filters?.channel) {
        where.channel = filters.channel;
      }

      const [notifications, total] = await Promise.all([
        this.prismaService.notification.findMany({
          where,
          skip: pagination.getOffset(),
          take: pagination.getLimit(),
          orderBy: pagination.getOrderBy(),
        }),
        this.prismaService.notification.count({ where }),
      ]);

      const pages = Math.ceil(total / pagination.getLimit());

      return {
        data: notifications,
        total,
        page: pagination.page,
        limit: pagination.getLimit(),
        pages,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch notifications for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    try {
      const notification = await this.prismaService.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${notificationId} not found`);
      }

      if (notification.userId !== userId) {
        throw new BadRequestException('Cannot mark other users notifications as read');
      }

      const updated = await this.prismaService.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`Notification marked as read: ${notificationId}`);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    try {
      const result = await this.prismaService.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`Marked ${result.count} notifications as read for user ${userId}`);

      return { updated: result.count };
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    try {
      const unreadCount = await this.prismaService.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return { unreadCount };
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await this.prismaService.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${notificationId} not found`);
      }

      if (notification.userId !== userId) {
        throw new BadRequestException('Cannot delete other users notifications');
      }

      await this.prismaService.notification.delete({
        where: { id: notificationId },
      });

      this.logger.log(`Notification deleted: ${notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification via external channels
   * Placeholder implementation for actual channel integrations
   */
  private async sendViaChannel(
    user: any,
    createDto: CreateNotificationDto,
    notificationId: string,
  ): Promise<void> {
    try {
      switch (createDto.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(user.email, createDto.title, createDto.body);
          break;

        case NotificationChannel.SMS:
          if (user.phone) {
            await this.sendSMS(user.phone, createDto.body);
          }
          break;

        case NotificationChannel.WHATSAPP:
          if (user.phone) {
            await this.sendWhatsApp(user.phone, createDto.title, { body: createDto.body });
          }
          break;

        case NotificationChannel.PUSH:
          // TODO: Implement push notification service
          this.logger.warn(`Push notifications not yet implemented for ${notificationId}`);
          break;

        default:
          // IN_APP - no external send needed
          break;
      }
    } catch (error) {
      this.logger.warn(`Failed to send ${createDto.channel} notification: ${error.message}`);
      // Don't throw - notification was created in DB, channel send is best-effort
    }
  }

  /**
   * Send email notification
   * Placeholder - integrate with email service (SendGrid, AWS SES, etc.)
   */
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[EMAIL SERVICE] Sending email to ${to}: ${subject}`);
    // TODO: Implement email sending via EmailService
    // await this.emailService.send({ to, subject, body });
  }

  /**
   * Send SMS notification
   * Placeholder - integrate with SMS service (Twilio, AWS SNS, etc.)
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    this.logger.log(`[SMS SERVICE] Sending SMS to ${phone}: ${message.substring(0, 50)}...`);
    // TODO: Implement SMS sending via SmsService
    // await this.smsService.send({ phone, message });
  }

  /**
   * Send WhatsApp notification
   * Placeholder - integrate with WhatsApp service (Twilio, Gupshup, etc.)
   */
  async sendWhatsApp(phone: string, template: string, params?: Record<string, any>): Promise<void> {
    this.logger.log(`[WHATSAPP SERVICE] Sending WhatsApp to ${phone} with template: ${template}`);
    // TODO: Implement WhatsApp sending via WhatsAppService
    // await this.whatsappService.send({ phone, template, params });
  }
}
