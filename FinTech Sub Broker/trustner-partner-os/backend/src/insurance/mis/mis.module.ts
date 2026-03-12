import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MISEntryService } from './mis-entry.service';
import { MISEntryController } from './mis-entry.controller';
import { MISVerificationService } from './mis-verification.service';
import { MISVerificationController } from './mis-verification.controller';
import { MISReportService } from './mis-report.service';
import { MISReportController, MISDashboardController } from './mis-report.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MISEntryController, MISVerificationController, MISReportController, MISDashboardController],
  providers: [MISEntryService, MISVerificationService, MISReportService],
  exports: [MISEntryService, MISVerificationService, MISReportService],
})
export class MISModule {}
