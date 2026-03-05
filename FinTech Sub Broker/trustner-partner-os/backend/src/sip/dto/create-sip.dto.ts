import {
  IsString,
  IsUUID,
  IsEnum,
  IsDecimal,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SIPFrequency } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateSIPDto {
  @ApiProperty({
    description: 'Client ID',
    example: 'clnt-12345678',
  })
  @IsString()
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Mutual Fund Scheme ID',
    example: 'scheme-12345',
  })
  @IsString()
  @IsUUID()
  schemeId: string;

  @ApiProperty({
    description: 'Monthly SIP amount in INR',
    example: '5000.00',
  })
  @IsDecimal({ decimal_digits: '1,2' })
  amount: string;

  @ApiProperty({
    description: 'SIP frequency',
    enum: SIPFrequency,
    example: 'MONTHLY',
  })
  @IsEnum(SIPFrequency)
  frequency: SIPFrequency;

  @ApiProperty({
    description: 'Day of month for SIP (1-28)',
    example: 15,
    minimum: 1,
    maximum: 28,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  sipDate: number;

  @ApiProperty({
    description: 'SIP start date (ISO format)',
    example: '2026-03-15',
  })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'SIP end date (ISO format)',
    example: '2030-03-15',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Total number of installments',
    example: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalInstallments?: number;
}
