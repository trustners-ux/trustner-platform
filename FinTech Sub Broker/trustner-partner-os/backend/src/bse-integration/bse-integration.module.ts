import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BSEIntegrationService } from './bse-integration.service';

/**
 * BSE Integration Module
 * Handles BSE Star MF API integration for transaction processing
 * Ready for API credentials configuration
 */
@Module({
  imports: [PrismaModule],
  providers: [BSEIntegrationService],
  exports: [BSEIntegrationService],
})
export class BSEIntegrationModule {}
