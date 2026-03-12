import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InsuranceClientsService } from './insurance-clients.service';
import { CreateInsuranceClientDto } from './dto/create-insurance-client.dto';
import { UpdateInsuranceClientDto } from './dto/update-insurance-client.dto';

@Controller('insurance/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InsuranceClientsController {
  constructor(private readonly clientsService: InsuranceClientsService) {}

  @Post()
  create(@Body() dto: CreateInsuranceClientDto, @Request() req: any) {
    return this.clientsService.create(dto, req.user.id);
  }

  @Get('stats')
  getStats() {
    return this.clientsService.getStats();
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.clientsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      city,
      kycStatus,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/portfolio')
  getPortfolio(@Param('id') id: string) {
    return this.clientsService.getPortfolio(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInsuranceClientDto) {
    return this.clientsService.update(id, dto);
  }
}
