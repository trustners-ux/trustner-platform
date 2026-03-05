import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  IsUrl,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionTier } from '@prisma/client';

export class CreateSubBrokerDto {
  @ApiProperty({
    description: 'Sub-broker company name',
    example: 'ABC Financial Services',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'ARN (AMFI Registration Number)',
    example: 'ARN-12345',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  arn: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@abc-financial.in',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+919876543210',
  })
  @IsPhoneNumber('IN')
  phone: string;

  @ApiPropertyOptional({
    description: 'Office address line 1',
    example: '123 Business Street',
  })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Office address line 2',
    example: 'Suite 100',
  })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '400001',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Geographic region/branch',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    description: 'Regional head ID',
    example: 'rh-12345',
  })
  @IsOptional()
  @IsString()
  regionalHeadId?: string;

  @ApiPropertyOptional({
    description: 'Company PAN',
    example: 'AABCU1234K',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  pan?: string;

  @ApiPropertyOptional({
    description: 'Company GST number',
    example: '27AABCU1234K1Z5',
  })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '123456789012345',
  })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    description: 'Bank IFSC code',
    example: 'HDFC0000001',
  })
  @IsOptional()
  @IsString()
  bankIfscCode?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'HDFC Bank',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://www.abc-financial.in',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Initial Assets Under Management (in rupees)',
    example: 5000000,
  })
  @IsOptional()
  @IsNumber()
  initialAUM?: number;

  @ApiPropertyOptional({
    description: 'Commission tier',
    enum: CommissionTier,
    example: CommissionTier.STARTER,
  })
  @IsOptional()
  @IsEnum(CommissionTier)
  commissionTier?: CommissionTier;

  @ApiPropertyOptional({
    description: 'Document URLs for KYC',
    example: ['https://example.com/doc1.pdf'],
  })
  @IsOptional()
  @IsArray()
  documentUrls?: string[];

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'We are a leading financial services provider',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
