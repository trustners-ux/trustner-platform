import {
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveAlertDto {
  @ApiProperty({
    description: 'Resolution details/comments',
    example: 'ARN certificate has been renewed and uploaded',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  resolution: string;
}
