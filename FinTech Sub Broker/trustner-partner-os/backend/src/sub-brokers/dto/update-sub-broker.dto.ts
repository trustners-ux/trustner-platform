import { PartialType } from '@nestjs/swagger';
import { CreateSubBrokerDto } from './create-sub-broker.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubBrokerStatus } from '@prisma/client';

export class UpdateSubBrokerDto extends PartialType(CreateSubBrokerDto) {
  @ApiPropertyOptional({
    description: 'Status of the sub-broker',
    enum: SubBrokerStatus,
    example: SubBrokerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SubBrokerStatus)
  status?: SubBrokerStatus;
}
