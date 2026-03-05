import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AlertType, AlertSeverity } from '@prisma/client';

export class CreateAlertDto {
  @ApiPropertyOptional({
    description: 'Sub-broker ID associated with the alert',
    example: 'sub-broker-123',
  })
  @IsOptional()
  @IsString()
  subBrokerId?: string;

  @ApiPropertyOptional({
    description: 'Client ID associated with the alert',
    example: 'client-456',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({
    description: 'Alert type',
    enum: AlertType,
    example: AlertType.ARN_EXPIRY,
  })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({
    description: 'Alert severity level',
    enum: AlertSeverity,
    example: AlertSeverity.HIGH,
  })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({
    description: 'Alert title',
    example: 'ARN Certificate Expiring Soon',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Detailed alert description',
    example: 'Your ARN certificate will expire on 2024-12-31',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({
    description: 'Due date for resolution',
    example: '2024-12-25',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;
}
