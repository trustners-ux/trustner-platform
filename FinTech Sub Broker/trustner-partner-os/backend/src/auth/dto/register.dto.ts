import { IsEmail, IsString, MinLength, MaxLength, IsEnum, IsPhoneNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@trustner.in',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters, must include uppercase, lowercase, number, special char)',
    example: 'SecurePassword@123',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100)
  password: string;

  @ApiProperty({
    description: 'User phone number (international format)',
    example: '+919876543210',
  })
  @IsPhoneNumber('IN', { message: 'Phone number must be valid for India (+91)' })
  phone: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.SUB_BROKER,
  })
  @IsEnum(UserRole, { message: `Role must be one of: ${Object.values(UserRole).join(', ')}` })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Sub-broker ID (required if role is SUB_BROKER)',
    example: 'sb-12345',
  })
  @IsOptional()
  @IsString()
  subBrokerId?: string;

  @ApiPropertyOptional({
    description: 'Client ID (required if role is CLIENT)',
    example: 'c-12345',
  })
  @IsOptional()
  @IsString()
  clientId?: string;
}
