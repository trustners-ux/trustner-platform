import {
  IsString,
  IsUUID,
  IsEnum,
  IsDecimal,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
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
    description: 'Transaction type',
    enum: TransactionType,
    example: 'LUMPSUM',
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction amount in INR',
    example: '50000.00',
  })
  @IsDecimal({ decimal_digits: '1,2' })
  amount: string;

  @ApiPropertyOptional({
    description: 'Folio number',
    example: 'F12345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  folioNumber?: string;

  @ApiPropertyOptional({
    description: 'Payment mode (NETBANKING, UPI, NACH, etc.)',
    example: 'NETBANKING',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMode?: string;

  @ApiPropertyOptional({
    description: 'Scheme ID to switch to (for SWITCH transactions)',
    example: 'scheme-99999',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  switchToSchemeId?: string;

  @ApiPropertyOptional({
    description: 'Scheme ID for STP (for STP transactions)',
    example: 'scheme-88888',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  stpToSchemeId?: string;
}
