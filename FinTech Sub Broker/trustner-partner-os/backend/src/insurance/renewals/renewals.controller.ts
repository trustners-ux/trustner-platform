import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RenewalsService } from './renewals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Renewals')
@Controller('insurance/renewals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class RenewalsController {
  constructor(private renewalsService: RenewalsService) {}

  /**
   * Get renewal stats
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get renewal stats', description: 'Due this month, renewed, lapsed counts' })
  @ApiResponse({ status: 200, description: 'Stats data' })
  async getStats() {
    return this.renewalsService.getStats();
  }

  /**
   * List all renewal trackers
   */
  @Get()
  @ApiOperation({ summary: 'List all renewals', description: 'Paginated list of renewal trackers' })
  @ApiResponse({ status: 200, description: 'Renewals list' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.renewalsService.findAll(Number(page) || 1, Number(limit) || 20, status);
  }

  /**
   * Scan for renewals (scheduled task)
   */
  @Post('scan')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Scan for renewals',
    description:
      'Find policies expiring soon and create renewal trackers (scheduled task)',
  })
  @ApiResponse({ status: 200, description: 'Scan completed' })
  async scanForRenewals() {
    return this.renewalsService.scanForRenewals();
  }

  /**
   * Update renewal status
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update renewal status',
    description: 'Update renewal tracker status',
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateRenewalStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.renewalsService.updateRenewalStatus(id, body.status as any);
  }

  /**
   * Send renewal reminder
   */
  @Post(':id/send-reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send renewal reminder',
    description: 'Send reminder via SMS/WhatsApp/Email',
  })
  @ApiResponse({ status: 200, description: 'Reminder sent' })
  async sendRenewalReminder(
    @Param('id') id: string,
    @Body() body: { channel: 'SMS' | 'WHATSAPP' | 'EMAIL' },
  ) {
    return this.renewalsService.sendRenewalReminder(id, body.channel);
  }

  /**
   * Mark as renewed
   */
  @Post(':id/mark-renewed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark as renewed',
    description: 'Mark renewal as successful with new policy ID',
  })
  @ApiResponse({ status: 200, description: 'Marked renewed' })
  async markRenewed(
    @Param('id') id: string,
    @Body() body: { newPolicyId: string },
  ) {
    return this.renewalsService.markRenewed(id, body.newPolicyId);
  }

  /**
   * Mark as lost
   */
  @Post(':id/mark-lost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark as lost',
    description: 'Mark renewal as lost to competitor',
  })
  @ApiResponse({ status: 200, description: 'Marked lost' })
  async markLost(
    @Param('id') id: string,
    @Body() body: { reason: string; competitorName?: string },
  ) {
    return this.renewalsService.markLost(id, body.reason, body.competitorName);
  }

  /**
   * Get POSP renewal dashboard
   */
  @Get('dashboard/:pospId')
  @ApiOperation({
    summary: "Get POSP's renewal dashboard",
    description: 'Get upcoming renewals grouped by timeframe',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getRenewalDashboard(@Param('pospId') pospId: string) {
    return this.renewalsService.getRenewalDashboard(pospId);
  }

  /**
   * Get renewal analytics
   */
  @Get('analytics/overview')
  @ApiOperation({
    summary: 'Get renewal analytics',
    description: 'Renewal rate, lapsed %, competitor analysis',
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getRenewalAnalytics() {
    return this.renewalsService.getRenewalAnalytics();
  }
}
