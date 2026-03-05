import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HoldingsService } from './holdings.service';
import { HoldingsController } from './holdings.controller';

/**
 * Holdings Module
 * Manages client investment holdings and portfolio tracking
 * Handles NAV updates and portfolio valuation
 */
@Module({
  imports: [PrismaModule],
  providers: [HoldingsService],
  controllers: [HoldingsController],
  exports: [HoldingsService],
})
export class HoldingsModule {}
