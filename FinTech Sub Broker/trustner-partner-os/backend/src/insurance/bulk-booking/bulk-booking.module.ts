import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BulkBookingService } from './bulk-booking.service';
import { BulkBookingController } from './bulk-booking.controller';

/**
 * Bulk Booking Module
 * Handles bulk offline policy booking via Excel/CSV upload and processing
 */
@Module({
  imports: [PrismaModule],
  providers: [BulkBookingService],
  controllers: [BulkBookingController],
  exports: [BulkBookingService],
})
export class BulkBookingModule {}
