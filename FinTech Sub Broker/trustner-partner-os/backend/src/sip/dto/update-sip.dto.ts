import {
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
  IsDecimal,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SIPStatus } from '@prisma/client';

export class UpdateSIPDto {
  @ApiPropertyOptional({
    description: 'Update SIP status',
    enum: SIPStatus,
    example: 'PAUSED',
  })
  @IsOptional()
  @IsEnum(SIPStatus)
  status?: SIPStatus;

  @ApiPropertyOptional({
    description: 'New monthly amount',
    example: '7500.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,2' })
  amount?: string;

  @ApiPropertyOptional({
    description: 'New end date',
    example: '2032-03-15',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Reason for pause/cancel',
    example: 'Personal financial constraints',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Customer requested',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
