import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InsuranceCommissionsService } from './insurance-commissions.service';
import { InsuranceCommissionsController } from './insurance-commissions.controller';

/**
 * Insurance Commission Engine Module
 * Heart of insurance backend: slab-based commission calculation, reconciliation, and payouts
 */
@Module({
  imports: [PrismaModule],
  providers: [InsuranceCommissionsService],
  controllers: [InsuranceCommissionsController],
  exports: [InsuranceCommissionsService],
})
export class InsuranceCommissionsModule {}
