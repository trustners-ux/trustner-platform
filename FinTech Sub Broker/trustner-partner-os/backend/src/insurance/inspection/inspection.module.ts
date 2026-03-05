import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InspectionService } from './inspection.service';
import { InspectionController } from './inspection.controller';

/**
 * Inspection Module
 * Manages vehicle inspection and Vaahan API integration
 */
@Module({
  imports: [PrismaModule],
  providers: [InspectionService],
  controllers: [InspectionController],
  exports: [InspectionService],
})
export class InspectionModule {}
