import { IsString, IsInt, IsArray, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new payout
 * Aggregates commissions for a specific period and sub-broker
 */
export class CreatePayoutDto {
  @ApiProperty({
    description: 'Sub-broker ID (partner)',
    example: 'sb-12345',
  })
  @IsString()
  subBrokerId: string;

  @ApiProperty({
    description: 'Period month (1-12)',
    example: 2,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @ApiProperty({
    description: 'Period year',
    example: 2026,
    minimum: 2020,
  })
  @IsInt()
  @Min(2020)
  periodYear: number;

  @ApiPropertyOptional({
    description: 'Array of commission IDs to include in payout',
    example: ['comm-001', 'comm-002'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commissionIds?: string[];
}
