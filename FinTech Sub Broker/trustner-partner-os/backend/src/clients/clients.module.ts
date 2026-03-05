import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';

/**
 * Clients Module
 * Manages client profiles, KYC, risk assessment, and portfolios
 * - Client registration and onboarding
 * - KYC status tracking and verification
 * - Bank account management
 * - Portfolio tracking and risk profiles
 * - Investment tracking (holdings, SIPs, transactions)
 */
@Module({
  imports: [PrismaModule],
  providers: [ClientsService],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
