import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, AlertType, AlertSeverity } from '@prisma/client';

@ApiTags('Compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Post('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create compliance alert' })
  @ApiResponse({ status: 201, description: 'Alert created' })
  async createAlert(@Body() createDto: CreateAlertDto) {
    return this.complianceService.createAlert(createDto);
  }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.REGIONAL_HEAD, UserRole.PARTNER_MANAGER)
  @ApiOperation({ summary: 'Get all compliance alerts' })
  async findAll(@Query() pagination: PaginationDto, @Query('type') type?: AlertType, @Query('severity') severity?: AlertSeverity, @Query('isResolved') isResolved?: string, @Query('subBrokerId') subBrokerId?: string) {
    const filters = { type, severity, isResolved: isResolved !== undefined ? isResolved === 'true' : undefined, subBrokerId };
    return this.complianceService.findAll(pagination, filters);
  }

  @Get('alerts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.REGIONAL_HEAD, UserRole.PARTNER_MANAGER)
  @ApiOperation({ summary: 'Get compliance alert' })
  async findOne(@Param('id') id: string) {
    return this.complianceService.findOne(id);
  }

  @Post('alerts/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve alert' })
  async resolve(@Param('id') id: string, @Body() resolveDto: ResolveAlertDto, @CurrentUser() user: any) {
    return this.complianceService.resolve(id, resolveDto, user.id);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({ summary: 'Get compliance summary' })
  async getAlertsSummary() {
    return this.complianceService.getAlertsSummary();
  }

  @Post('run-checks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run compliance checks' })
  async runComplianceChecks() {
    return this.complianceService.runComplianceChecks();
  }

  @Get('partner/:subBrokerId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.REGIONAL_HEAD, UserRole.PARTNER_MANAGER)
  @ApiOperation({ summary: 'Get sub-broker alerts' })
  async getSubBrokerAlerts(@Param('subBrokerId') subBrokerId: string, @Query() pagination: PaginationDto) {
    return this.complianceService.getSubBrokerAlerts(subBrokerId, pagination);
  }
}
