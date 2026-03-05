import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Recipient user ID',
    example: 'user-12345',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Account Alert',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Notification body/message',
    example: 'Your ARN certificate will expire in 30 days',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional({
    description: 'Notification channel',
    enum: NotificationChannel,
    example: NotificationChannel.IN_APP,
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel = NotificationChannel.IN_APP;

  @ApiPropertyOptional({
    description: 'URL to navigate to when notification is clicked',
    example: 'https://app.trustner.com/compliance/alerts/123',
  })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { alertId: '123', priority: 'high' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
