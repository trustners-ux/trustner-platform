import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';

/**
 * Commissions Module
 * THE HEART OF THE SYSTEM
 * Manages RTA file imports, commission calculations, TDS/GST processing
 * and commission payouts
 */
@Module({
  imports: [PrismaModule],
  providers: [CommissionsService],
  controllers: [CommissionsController],
  exports: [CommissionsService],
})
export class CommissionsModule {}
