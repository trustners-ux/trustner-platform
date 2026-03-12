import { PartialType } from '@nestjs/mapped-types';
import { CreateInsuranceClientDto } from './create-insurance-client.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateInsuranceClientDto extends PartialType(CreateInsuranceClientDto) {
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'VERIFIED', 'INCOMPLETE'])
  kycStatus?: string;

  @IsOptional()
  isActive?: boolean;
}
