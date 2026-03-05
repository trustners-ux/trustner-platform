import { IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SetTargetDto {
  @ApiProperty({ description: 'Sub-broker ID', example: 'sub-broker-123' })
  @IsString()
  subBrokerId: string;

  @ApiProperty({ description: 'Month (1-12)', example: 3, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Year', example: 2024, minimum: 2020 })
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  year: number;

  @ApiProperty({ description: 'AUM target in rupees', example: 50000000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  aumTarget: number;

  @ApiProperty({ description: 'SIP target in rupees', example: 10000000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sipTarget: number;

  @ApiProperty({ description: 'Client count target', example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  clientTarget: number;
}
