import { IsOptional, IsString, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AuditAction } from '@prisma/client';

export class QueryAuditDto {
  @ApiPropertyOptional({ description: 'Filter by user ID', example: 'user-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by audit action', enum: AuditAction })
  @IsOptional()
  @IsString()
  action?: AuditAction;

  @ApiPropertyOptional({ description: 'Filter by entity type', example: 'SubBroker' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID', example: 'sb-123' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
