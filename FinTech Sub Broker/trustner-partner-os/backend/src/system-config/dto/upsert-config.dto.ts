import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertConfigDto {
  @ApiProperty({
    description: 'Configuration key (unique identifier)',
    example: 'MAX_LOGIN_ATTEMPTS',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  key: string;

  @ApiProperty({
    description: 'Configuration value',
    example: '5',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  value: string;

  @ApiPropertyOptional({
    description: 'Configuration category',
    example: 'SECURITY',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Maximum number of failed login attempts',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
