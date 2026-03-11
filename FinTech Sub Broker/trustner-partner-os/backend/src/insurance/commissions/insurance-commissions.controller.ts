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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InsuranceCommissionsService } from './insurance-commissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Commission Engine')
@Controller('insurance/commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class InsuranceCommissionsController {
  constructor(private commissionsService: InsuranceCommissionsService) {}

  /**
   * Configure commission slabs
   */
  @Post('slabs/configure')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Configure commission slabs',
    description:
      'Set up slab-based commission structure for company/LOB combination',
  })
  @ApiResponse({
    status: 201,
    description: 'Slabs configured',
  })
  async configureSlabs(
    @Body()
    body: {
      companyId: string;
      lob: string;
      slabs: Array<{
        slabName: string;
        minPremium: number;
        maxPremium: number;
        brokerRate: number;
        pospShareRate: number;
        effectiveFrom: string;
        effectiveTo?: string;
      }>;
    },
  ) {
    return this.commissionsService.configureSlabs(
      body.companyId,
      body.lob,
      body.slabs,
    );
  }

  /**
   * Get commission slabs
   */
  @Get('slabs')
  @ApiOperation({
    summary: 'Get commission slabs',
    description: 'Get active commission slabs for company/LOB',
  })
  @ApiResponse({ status: 200, description: 'Slabs list' })
  async getSlabs(
    @Query('companyId') companyId: string,
    @Query('lob') lob: string,
  ) {
    return this.commissionsService.getSlabs(companyId, lob);
  }

  /**
   * Calculate commission for policy
   */
  @Post('calculate/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Calculate commission',
    description:
      'Calculate commission for policy based on slabs and cumulative premium',
  })
  @ApiResponse({
    status: 201,
    description: 'Commission calculated',
  })
  async calculateCommission(
    @Param('policyId') policyId: string,
    @Query('type') type: string = 'FIRST_YEAR',
  ) {
    return this.commissionsService.calculateCommission(policyId, type as any);
  }

  /**
   * Batch calculate commissions
   */
  @Post('batch-calculate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Batch calculate commissions',
    description: 'Calculate all pending commissions for a month',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch calculation completed',
  })
  async batchCalculate(
    @Body() body: { month: number; year: number },
  ) {
    return this.commissionsService.batchCalculate(body.month, body.year);
  }

  /**
   * Reconcile with insurer
   */
  @Post('reconcile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reconcile with insurer',
    description: 'Match receivables from insurer',
  })
  @ApiResponse({ status: 200, description: 'Reconciliation done' })
  async reconcileWithInsurer(
    @Body()
    body: {
      companyId: string;
      month: number;
      year: number;
      receivedAmount: number;
    },
  ) {
    return this.commissionsService.reconcileWithInsurer(
      body.companyId,
      body.month,
      body.year,
      body.receivedAmount,
    );
  }

  /**
   * Process clawback
   */
  @Post('clawback')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Process clawback',
    description: 'Deduct amount from commission (e.g., for policy cancellation)',
  })
  @ApiResponse({ status: 201, description: 'Clawback processed' })
  async processClawback(
    @Body()
    body: {
      policyId: string;
      reason: string;
      amount: number;
    },
  ) {
    return this.commissionsService.processClawback(
      body.policyId,
      body.reason,
      body.amount,
    );
  }

  /**
   * Generate payouts
   */
  @Post('payouts/generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate payouts',
    description: 'Aggregate commissions and create payout records per POSP',
  })
  @ApiResponse({ status: 201, description: 'Payouts generated' })
  async generatePayouts(
    @Body() body: { month: number; year: number },
  ) {
    return this.commissionsService.generatePayouts(body.month, body.year);
  }

  /**
   * Approve payout
   */
  @Patch('payouts/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Approve payout',
    description: 'Approve POSP payout',
  })
  @ApiResponse({ status: 200, description: 'Approved' })
  async approvePayout(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.approvePayout(id, user.id);
  }

  /**
   * Mark payout as paid
   */
  @Patch('payouts/:id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Mark payout as paid',
    description: 'Record bank reference for paid payout',
  })
  @ApiResponse({ status: 200, description: 'Marked paid' })
  async markPaid(
    @Param('id') id: string,
    @Body() body: { bankRef: string },
  ) {
    return this.commissionsService.markPaid(id, body.bankRef);
  }

  /**
   * Get commission statement
   */
  @Get('statement/:pospId')
  @ApiOperation({
    summary: 'Get commission statement',
    description: 'Get commission details for POSP for specific month',
  })
  @ApiResponse({ status: 200, description: 'Statement data' })
  async getCommissionStatement(
    @Param('pospId') pospId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.commissionsService.getCommissionStatement(
      pospId,
      parseInt(month),
      parseInt(year),
    );
  }

  /**
   * Get receivables report
   */
  @Get('reports/receivables')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get receivables report',
    description: 'What Trustner should receive from insurers',
  })
  @ApiResponse({ status: 200, description: 'Receivables report' })
  async getReceivablesReport(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.commissionsService.getReceivablesReport(
      parseInt(month),
      parseInt(year),
    );
  }

  /**
   * Get payables report
   */
  @Get('reports/payables')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get payables report',
    description: 'What Trustner should pay to POSPs',
  })
  @ApiResponse({ status: 200, description: 'Payables report' })
  async getPayablesReport(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.commissionsService.getPayablesReport(
      parseInt(month),
      parseInt(year),
    );
  }

  // ============================================================================
  // PAYOUT MODEL CONFIGURATION
  // ============================================================================

  @Post('payout-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRINCIPAL_OFFICER)
  @ApiOperation({
    summary: 'Set POSP payout configuration',
    description: 'Configure payout model (Slab-Based, Flat Rate, Custom) for a POSP',
  })
  @ApiResponse({ status: 201, description: 'Payout config set' })
  async setPayoutConfig(@Body() body: { pospId: string; payoutModel: string; flatRatePct?: number; remarks?: string; effectiveFrom?: string; effectiveTo?: string }, @Request() req: any) {
    return this.commissionsService.setPayoutConfig(body.pospId, body, req.user.id);
  }

  @Get('payout-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRINCIPAL_OFFICER)
  @ApiOperation({
    summary: 'List all payout configurations',
    description: 'Get all POSP payout model configurations',
  })
  @ApiResponse({ status: 200, description: 'Payout config list' })
  async listPayoutConfigs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.commissionsService.listPayoutConfigs(Number(page) || 1, Number(limit) || 50);
  }

  @Get('payout-config/:pospId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRINCIPAL_OFFICER)
  @ApiOperation({
    summary: 'Get POSP payout configuration',
    description: 'Get payout model config for a specific POSP',
  })
  @ApiResponse({ status: 200, description: 'Payout config' })
  async getPayoutConfig(@Param('pospId') pospId: string) {
    return this.commissionsService.getPayoutConfig(pospId);
  }
}
