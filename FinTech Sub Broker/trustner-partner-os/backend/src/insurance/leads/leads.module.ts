import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

/**
 * Lead Management Module
 * Manages insurance sales funnel from lead creation to policy conversion
 */
@Module({
  imports: [PrismaModule],
  providers: [LeadsService],
  controllers: [LeadsController],
  exports: [LeadsService],
})
export class LeadsModule {}
