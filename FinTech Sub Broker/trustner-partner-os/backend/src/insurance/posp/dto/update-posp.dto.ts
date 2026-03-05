import { IsString, IsOptional, IsEmail, IsPhoneNumber, Length } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreatePOSPDto } from './create-posp.dto';

/**
 * Update POSP DTO
 * Partial version of CreatePOSPDto for update operations
 */
export class UpdatePOSPDto extends PartialType(CreatePOSPDto) {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber('IN')
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  pincode?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
