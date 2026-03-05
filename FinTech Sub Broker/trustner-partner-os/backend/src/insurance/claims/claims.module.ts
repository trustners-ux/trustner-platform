import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';

/**
 * Claims Management Module
 * Handles claim intimation, processing, investigation, approval, and settlement
 */
@Module({
  imports: [PrismaModule],
  providers: [ClaimsService],
  controllers: [ClaimsController],
  exports: [ClaimsService],
})
export class ClaimsModule {}
