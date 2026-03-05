import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddBankAccountDto {
  @ApiProperty({
    description: 'Bank account number',
    example: '123456789012345678',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(30)
  accountNumber: string;

  @ApiProperty({
    description: 'IFSC code of the bank',
    example: 'HDFC0000001',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  ifscCode: string;

  @ApiProperty({
    description: 'Bank name',
    example: 'HDFC Bank',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  bankName: string;

  @ApiPropertyOptional({
    description: 'Branch name',
    example: 'Mumbai - Fort',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  branchName?: string;

  @ApiPropertyOptional({
    description: 'Account type (SAVINGS, CURRENT, etc)',
    example: 'SAVINGS',
    enum: ['SAVINGS', 'CURRENT', 'NRE', 'NRO'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accountType?: string;

  @ApiPropertyOptional({
    description: 'Set as primary account',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
