import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';

/**
 * Policy Management Module
 * Manages insurance policy lifecycle with state machine validation
 * Handles quotes, proposals, payment, issuance, renewals, and claims
 */
@Module({
  imports: [PrismaModule],
  providers: [PoliciesService],
  controllers: [PoliciesController],
  exports: [PoliciesService],
})
export class PoliciesModule {}
