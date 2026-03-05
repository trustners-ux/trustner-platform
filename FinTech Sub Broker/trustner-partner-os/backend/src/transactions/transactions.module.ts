import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

/**
 * Transactions Module
 * Manages investment transactions, SIPs, redemptions, switches, STPs, SWPs
 * Handles transaction lifecycle from initiation to allotment
 */
@Module({
  imports: [PrismaModule],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
