import { IsString, IsDecimal, IsEnum, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { InsuranceLOB } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty({
    example: 'posp-001',
    description: 'POSP agent ID',
  })
  @IsString()
  pospId: string;

  @ApiProperty({
    example: 'company-001',
    description: 'Insurance company ID',
  })
  @IsString()
  companyId: string;

  @ApiProperty({
    example: 'product-001',
    description: 'Insurance product ID',
  })
  @IsString()
  productId: string;

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
  @IsString()
  customerPhone: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Customer email',
  })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    example: 'ABCDE1234F',
    description: 'Customer PAN (encrypted)',
  })
  @IsString()
  @IsOptional()
  customerPan?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Customer Aadhaar last 4 digits (encrypted)',
  })
  @IsString()
  @IsOptional()
  customerAadhaar?: string;

  @ApiProperty({
    example: 500000,
    description: 'Sum insured amount',
  })
  @IsNumber()
  sumInsured: number;

  @ApiProperty({
    example: 12500,
    description: 'Base premium',
  })
  @IsNumber()
  basePremium: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Add-on premium',
  })
  @IsNumber()
  @IsOptional()
  addOnPremium?: number;

  @ApiProperty({
    example: 2250,
    description: 'GST amount',
  })
  @IsNumber()
  gstAmount: number;

  @ApiProperty({
    example: 14750,
    description: 'Total premium',
  })
  @IsNumber()
  totalPremium: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Stamp duty',
  })
  @IsNumber()
  @IsOptional()
  stampDuty?: number;

  @ApiProperty({
    example: 14750,
    description: 'Net premium for commission calculation',
  })
  @IsNumber()
  netPremium: number;

  @ApiPropertyOptional({
    example: 'MH02AB1234',
    description: 'Vehicle registration number',
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
    example: '600000',
    description: 'IDV (Insured Declared Value)',
  })
  @IsNumber()
  @IsOptional()
  idv?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'NCB percentage',
  })
  @IsNumber()
  @IsOptional()
  ncbPercentage?: number;

  @ApiPropertyOptional({
    example: 'COMPREHENSIVE',
    description: 'Policy type (TP, OD, COMPREHENSIVE, BREAKIN, ROLLOVER)',
  })
  @IsString()
  @IsOptional()
  policyType?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Nominee name',
  })
  @IsString()
  @IsOptional()
  nomineeName?: string;

  @ApiPropertyOptional({
    example: 'Spouse',
    description: 'Nominee relation',
  })
  @IsString()
  @IsOptional()
  nomineeRelation?: string;

  @ApiPropertyOptional({
    example: '2026-02-25',
    description: 'Policy start date',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2027-02-25',
    description: 'Policy end date',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'Some remarks',
    description: 'Additional remarks',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
