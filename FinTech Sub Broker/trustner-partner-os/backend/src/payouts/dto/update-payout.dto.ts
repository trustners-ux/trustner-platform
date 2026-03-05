import { IsOptional, IsString, IsDecimal } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating payout status and adding reference details
 */
export class UpdatePayoutDto {
  @ApiPropertyOptional({
    description: 'Bank reference number for payment',
    example: 'HDFC/TXN/2026020512345',
  })
  @IsOptional()
  @IsString()
  bankRefNumber?: string;

  @ApiPropertyOptional({
    description: 'Reason for putting payout on hold',
    example: 'Bank account verification pending',
  })
  @IsOptional()
  @IsString()
  holdReason?: string;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Scheduled for payment on 28th',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Clawback amount if applicable',
    example: '5000.50',
  })
  @IsOptional()
  clawbackAmount?: string;
}
