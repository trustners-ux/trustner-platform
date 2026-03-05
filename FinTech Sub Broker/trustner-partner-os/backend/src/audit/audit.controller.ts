import { Controller, Get, Query, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all audit logs' })
  async findAll(@Query() pagination: PaginationDto, @Query('userId') userId?: string, @Query('action') action?: string, @Query('entity') entity?: string, @Query('entityId') entityId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const filters = {
      userId,
      action: action as any,
      entity,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.auditService.findAll(pagination, filters);
  }

  @Get('entity/:entity/:entityId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get entity audit trail' })
  async findByEntity(@Param('entity') entity: string, @Param('entityId') entityId: string) {
    return this.auditService.findByEntity(entity, entityId);
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user activity' })
  async getUserActivity(@Param('userId') userId: string, @Query() pagination: PaginationDto) {
    return this.auditService.getUserActivity(userId, pagination);
  }

  @Get('recent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.PARTNER_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recent activity' })
  async getRecentActivity(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditService.getRecentActivity(Math.min(limitNum, 500));
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get activity statistics' })
  async getActivityStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.auditService.getActivityStats(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
  }
}
