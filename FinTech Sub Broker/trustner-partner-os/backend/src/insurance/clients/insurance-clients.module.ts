import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InsuranceClientsService } from './insurance-clients.service';
import { InsuranceClientsController } from './insurance-clients.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InsuranceClientsController],
  providers: [InsuranceClientsService],
  exports: [InsuranceClientsService],
})
export class InsuranceClientsModule {}
