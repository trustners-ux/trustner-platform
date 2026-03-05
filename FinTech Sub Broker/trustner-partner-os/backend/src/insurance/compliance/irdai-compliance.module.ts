import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IRDAIComplianceService } from './irdai-compliance.service';
import { IRDAIComplianceController } from './irdai-compliance.controller';

/**
 * IRDAI Compliance Module
 * Generates regulatory reports and compliance checks
 */
@Module({
  imports: [PrismaModule],
  providers: [IRDAIComplianceService],
  controllers: [IRDAIComplianceController],
  exports: [IRDAIComplianceService],
})
export class IRDAIComplianceModule {}
