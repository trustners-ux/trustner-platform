import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RenewalsService } from './renewals.service';
import { RenewalsController } from './renewals.controller';

/**
 * Renewals Module
 * Manages policy renewal tracking, reminders, and analytics
 */
@Module({
  imports: [PrismaModule],
  providers: [RenewalsService],
  controllers: [RenewalsController],
  exports: [RenewalsService],
})
export class RenewalsModule {}
