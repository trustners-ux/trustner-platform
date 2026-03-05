import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';

/**
 * Payouts Module
 * Manages payout generation, approval, payment processing, and statements
 */
@Module({
  imports: [PrismaModule],
  providers: [PayoutsService],
  controllers: [PayoutsController],
  exports: [PayoutsService],
})
export class PayoutsModule {}
