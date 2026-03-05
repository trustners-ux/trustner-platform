import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { POSPService } from './posp.service';
import { POSPController } from './posp.controller';

/**
 * POSP Management Module
 * Manages insurance agents (POSP - Point of Sale Person)
 * Handles onboarding, training, certification, and activation
 */
@Module({
  imports: [PrismaModule],
  providers: [POSPService],
  controllers: [POSPController],
  exports: [POSPService],
})
export class POSPModule {}
