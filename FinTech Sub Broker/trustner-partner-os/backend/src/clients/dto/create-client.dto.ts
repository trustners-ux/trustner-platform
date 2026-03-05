import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'Sub-broker ID (who onboarded this client)',
    example: 'sb-12345',
  })
  @IsString()
  subBrokerId: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'client@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Client phone number (Indian format)',
    example: '+919876543210',
  })
  @IsPhoneNumber('IN')
  phone: string;

  @ApiProperty({
    description: 'First name',
    example: 'Rajesh',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Kumar',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    description: 'PAN Number (10 characters)',
    example: 'ABCDE1234F',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  panNumber?: string;

  @ApiPropertyOptional({
    description: 'Tax status of client',
    example: 'INDIVIDUAL',
    enum: ['INDIVIDUAL', 'HUF', 'COMPANY', 'PARTNERSHIP', 'TRUST', 'NRI'],
  })
  @IsOptional()
  @IsString()
  taxStatus?: string;

  @ApiPropertyOptional({
    description: 'Occupation of client',
    example: 'Service',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Annual income range',
    example: '5L-10L',
  })
  @IsOptional()
  @IsString()
  annualIncome?: string;

  @ApiPropertyOptional({
    description: 'Gender (M/F/Other)',
    example: 'M',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Apartment 4B',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'PIN code',
    example: '400001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string;
}
