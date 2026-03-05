import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsPhoneNumber, Length, ValidateNested, Type } from 'class-validator';
import { POSPCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePOSPDto {
  @ApiProperty({
    example: 'GENERAL',
    enum: POSPCategory,
    description: 'POSP Category: LIFE, GENERAL, HEALTH, LIFE_AND_GENERAL, LIFE_AND_HEALTH, GENERAL_AND_HEALTH, ALL',
  })
  @IsEnum(POSPCategory)
  category: POSPCategory;

  @ApiProperty({
    example: 'John',
    description: 'First name',
  })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
  })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date of birth (ISO 8601 format)',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    example: 'Male',
    description: 'Gender',
  })
  @IsString()
  gender: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number with country code',
  })
  @IsPhoneNumber('IN')
  phone: string;

  @ApiPropertyOptional({
    example: 'ABCDE1234F',
    description: 'PAN number (will be encrypted)',
  })
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Aadhaar number last 6 digits (will be encrypted)',
  })
  @IsString()
  @IsOptional()
  aadhaarNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main Street',
    description: 'Address line 1',
  })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional({
    example: 'Apt 101',
    description: 'Address line 2',
  })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiPropertyOptional({
    example: 'Mumbai',
    description: 'City',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Maharashtra',
    description: 'State',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    example: '400001',
    description: 'Pincode',
  })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional({
    example: 'branch-001',
    description: 'Branch ID',
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    example: 'manager-001',
    description: 'Reporting manager ID',
  })
  @IsString()
  @IsOptional()
  reportingManagerId?: string;

  @ApiPropertyOptional({
    example: 'region-001',
    description: 'Region ID',
  })
  @IsString()
  @IsOptional()
  regionId?: string;

  @ApiPropertyOptional({
    example: 'Some remarks about the agent',
    description: 'Additional remarks',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    example: 'sub-broker-001',
    description: 'Sub-broker ID if dual role',
  })
  @IsString()
  @IsOptional()
  subBrokerId?: string;
}

export class BankDetailsDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Bank account holder name',
  })
  @IsString()
  bankAccountName: string;

  @ApiProperty({
    example: '1234567890123456',
    description: 'Bank account number (will be encrypted)',
  })
  @IsString()
  bankAccountNumber: string;

  @ApiProperty({
    example: 'SBIN0001234',
    description: 'IFSC code',
  })
  @IsString()
  bankIfscCode: string;

  @ApiProperty({
    example: 'State Bank of India',
    description: 'Bank name',
  })
  @IsString()
  bankName: string;
}
