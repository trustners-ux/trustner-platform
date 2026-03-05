import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsObject,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from './create-notification.dto';

export class SendBulkNotificationDto {
  @ApiProperty({
    description: 'Array of recipient user IDs',
    example: ['user-1', 'user-2', 'user-3'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Notification title',
    example: 'Compliance Update',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Notification body/message',
    example: 'Please update your KYC information within 7 days',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional({
    description: 'Notification channel for bulk send',
    enum: NotificationChannel,
    example: NotificationChannel.IN_APP,
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel = NotificationChannel.IN_APP;

  @ApiPropertyOptional({
    description: 'URL to navigate to when notification is clicked',
    example: 'https://app.trustner.com/kyc/update',
  })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { campaignId: 'kyc-update-2024', priority: 'medium' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
