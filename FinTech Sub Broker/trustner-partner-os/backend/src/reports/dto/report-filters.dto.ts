import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for report filters
 * Common filters used across different report types
 */
export class ReportFiltersDto {
  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2026-02-28',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sub-broker ID to filter by',
    example: 'sb-12345',
  })
  @IsOptional()
  @IsString()
  subBrokerId?: string;

  @ApiPropertyOptional({
    description: 'Report type',
    example: 'AUM',
    enum: ['AUM', 'COMMISSION', 'SIP', 'PARTNER_PERFORMANCE', 'COMPLIANCE', 'RTA_IMPORTS'],
  })
  @IsOptional()
  @IsString()
  reportType?: string;
}
