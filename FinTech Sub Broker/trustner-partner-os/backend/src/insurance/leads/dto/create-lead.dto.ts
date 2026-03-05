import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsPhoneNumber, IsInt, IsDecimal } from 'class-validator';
import { InsuranceLOB, LeadSource } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({
    example: 'MOTOR_FOUR_WHEELER',
    enum: InsuranceLOB,
    description: 'Line of Business',
  })
  @IsEnum(InsuranceLOB)
  lob: InsuranceLOB;

  @ApiProperty({
    example: 'John Doe',
    description: 'Customer name',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Customer phone',
  })
  @IsPhoneNumber('IN')
  customerPhone: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Customer email',
  })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    example: 'Mumbai',
    description: 'Customer city',
  })
  @IsString()
  @IsOptional()
  customerCity?: string;

  @ApiPropertyOptional({
    example: 'Maharashtra',
    description: 'Customer state',
  })
  @IsString()
  @IsOptional()
  customerState?: string;

  @ApiPropertyOptional({
    example: '400001',
    description: 'Customer pincode',
  })
  @IsString()
  @IsOptional()
  customerPincode?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Date of birth',
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'WEBSITE',
    enum: LeadSource,
    description: 'Lead source',
  })
  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @ApiPropertyOptional({
    example: 'product-001',
    description: 'Product ID',
  })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    example: 'posp-001',
    description: 'POSP ID for assignment',
  })
  @IsString()
  @IsOptional()
  pospId?: string;

  @ApiPropertyOptional({
    example: 'MH02AB1234',
    description: 'Vehicle registration number (for motor)',
  })
  @IsString()
  @IsOptional()
  vehicleRegNumber?: string;

  @ApiPropertyOptional({
    example: 'Maruti',
    description: 'Vehicle make',
  })
  @IsString()
  @IsOptional()
  vehicleMake?: string;

  @ApiPropertyOptional({
    example: 'Swift',
    description: 'Vehicle model',
  })
  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @ApiPropertyOptional({
    example: 'VXI',
    description: 'Vehicle variant',
  })
  @IsString()
  @IsOptional()
  vehicleVariant?: string;

  @ApiPropertyOptional({
    example: 2020,
    description: 'Vehicle year',
  })
  @IsInt()
  @IsOptional()
  vehicleYear?: number;

  @ApiPropertyOptional({
    example: 'Petrol',
    description: 'Vehicle fuel type',
  })
  @IsString()
  @IsOptional()
  vehicleFuelType?: string;

  @ApiPropertyOptional({
    example: 'Bajaj Allianz',
    description: 'Previous insurer',
  })
  @IsString()
  @IsOptional()
  previousInsurer?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Previous policy expiry date',
  })
  @IsDateString()
  @IsOptional()
  previousPolicyExpiry?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'NCB percentage',
  })
  @IsOptional()
  ncbPercentage?: number;

  @ApiPropertyOptional({
    example: 600000,
    description: 'Insured Declared Value',
  })
  @IsOptional()
  idv?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of members (for health)',
  })
  @IsInt()
  @IsOptional()
  membersCount?: number;

  @ApiPropertyOptional({
    description: 'Members details array (for health)',
  })
  @IsOptional()
  membersDetails?: any;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Sum insured required (for health)',
  })
  @IsOptional()
  sumInsuredRequired?: number;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Annual income (for life)',
  })
  @IsOptional()
  annualIncome?: number;

  @ApiPropertyOptional({
    example: 'NON_SMOKER',
    description: 'Smoking status (for life)',
  })
  @IsString()
  @IsOptional()
  smokingStatus?: string;

  @ApiPropertyOptional({
    example: 1000000,
    description: 'Cover required (for life)',
  })
  @IsOptional()
  coverRequired?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is renewal lead',
  })
  @IsOptional()
  isRenewal?: boolean;

  @ApiPropertyOptional({
    example: 'POL-123456',
    description: 'Existing policy number (for renewal)',
  })
  @IsString()
  @IsOptional()
  existingPolicyNumber?: string;
}
