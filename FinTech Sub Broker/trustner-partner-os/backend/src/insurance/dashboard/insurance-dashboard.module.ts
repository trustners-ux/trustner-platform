import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InsuranceDashboardService } from './insurance-dashboard.service';
import { InsuranceDashboardController } from './insurance-dashboard.controller';

/**
 * Insurance Dashboard Module
 * Provides analytics and dashboards for admin and POSP views
 */
@Module({
  imports: [PrismaModule],
  providers: [InsuranceDashboardService],
  controllers: [InsuranceDashboardController],
  exports: [InsuranceDashboardService],
})
export class InsuranceDashboardModule {}
