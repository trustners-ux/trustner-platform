import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SIPService } from './sip.service';
import { SIPController } from './sip.controller';

/**
 * SIP Module
 * Manages Systematic Investment Plans and mandates
 * Handles SIP lifecycle and installment tracking
 */
@Module({
  imports: [PrismaModule],
  providers: [SIPService],
  controllers: [SIPController],
  exports: [SIPService],
})
export class SIPModule {}
