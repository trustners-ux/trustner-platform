import {
  IsOptional,
  IsDecimal,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHoldingDto {
  @ApiPropertyOptional({
    description: 'Updated current NAV',
    example: '132.45',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  currentNav?: string;

  @ApiPropertyOptional({
    description: 'Updated current value',
    example: '52980.45',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,2' })
  currentValue?: string;

  @ApiPropertyOptional({
    description: 'Updated average NAV',
    example: '125.50',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  avgNav?: string;

  @ApiPropertyOptional({
    description: 'Absolute return percentage',
    example: '12.50',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  absoluteReturn?: string;

  @ApiPropertyOptional({
    description: 'XIRR percentage',
    example: '8.75',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  xirr?: string;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'NAV updated from latest data',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
