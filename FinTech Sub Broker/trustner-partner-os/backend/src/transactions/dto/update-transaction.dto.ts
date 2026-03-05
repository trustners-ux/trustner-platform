import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsDecimal,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'Update transaction status',
    enum: TransactionStatus,
    example: 'PAYMENT_RECEIVED',
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'BSE Order ID',
    example: 'BSE-2026-002-000123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bseOrderId?: string;

  @ApiPropertyOptional({
    description: 'NAV at allotment',
    example: '125.50',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  allotmentNav?: string;

  @ApiPropertyOptional({
    description: 'Units allotted',
    example: '398.41',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  allotmentUnits?: string;

  @ApiPropertyOptional({
    description: 'Remarks or notes',
    example: 'Payment received successfully',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Failure reason if transaction failed',
    example: 'Insufficient balance',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}
