import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubBrokersService } from './sub-brokers.service';
import { SubBrokersController } from './sub-brokers.controller';

/**
 * Sub-Brokers Module
 * Manages sub-broker onboarding, KYC, performance tracking, and operations
 */
@Module({
  imports: [PrismaModule],
  providers: [SubBrokersService],
  controllers: [SubBrokersController],
  exports: [SubBrokersService],
})
export class SubBrokersModule {}
