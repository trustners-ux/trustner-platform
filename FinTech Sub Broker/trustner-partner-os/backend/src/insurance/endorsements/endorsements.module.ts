import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EndorsementsService } from './endorsements.service';
import { EndorsementsController } from './endorsements.controller';

/**
 * Endorsements Module
 * Manages policy endorsements (amendments)
 */
@Module({
  imports: [PrismaModule],
  providers: [EndorsementsService],
  controllers: [EndorsementsController],
  exports: [EndorsementsService],
})
export class EndorsementsModule {}
