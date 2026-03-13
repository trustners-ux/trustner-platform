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
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Claims Management')
@Controller('insurance/claims')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class ClaimsController {
  constructor(private claimsService: ClaimsService) {}

  /**
   * Intimate claim
   */
  @Post('intimate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Intimate claim',
    description: 'Create new claim with CLM-YYYYMMDD-XXXXX code',
  })
  @ApiResponse({
    status: 201,
    description: 'Claim intimated successfully',
  })
  async intimateClaim(
    @Body()
    claimDto: {
      policyId: string;
      claimType: string;
      incidentDate: string;
      description: string;
      estimatedAmount?: number;
    },
  ) {
    return this.claimsService.intimateClaim(claimDto);
  }

  /**
   * Get all claims
   */
  @Get()
  @ApiOperation({
    summary: 'Get all claims',
    description: 'List claims with filters by status, type, POSP, policy, date range',
  })
  @ApiResponse({ status: 200, description: 'Claims list' })
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('status') status?: string,
    @Query('claimType') claimType?: string,
    @Query('pospId') pospId?: string,
    @Query('policyId') policyId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.claimsService.findAll(
      {
        skip: parseInt(skip),
        take: parseInt(take),
      },
      {
        status: status as any,
        claimType,
        pospId,
        policyId,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      },
    );
  }

  // ─── Static routes MUST come before :id parameterized route ───

  /**
   * Get claim analytics
   */
  @Get('analytics/overview')
  @ApiOperation({
    summary: 'Get claim analytics',
    description:
      'Get TAT, approval rate, settlement ratio, claims by status and type',
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getClaimAnalytics() {
    return this.claimsService.getClaimAnalytics();
  }

  // ─── Parameterized routes below ───

  /**
   * Get single claim
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get claim details',
    description: 'Get full claim with documents and status history',
  })
  @ApiResponse({ status: 200, description: 'Claim details' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  /**
   * Update claim
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update claim',
    description: 'Update claim details',
  })
  @ApiResponse({ status: 200, description: 'Claim updated' })
  async updateClaim(
    @Param('id') id: string,
    @Body()
    updateDto: {
      description?: string;
      estimatedAmount?: number;
      providerName?: string;
      providerCity?: string;
      providerState?: string;
    },
  ) {
    return this.claimsService.updateClaim(id, updateDto);
  }

  /**
   * Update claim status
   */
  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update claim status',
    description: 'Change claim status with state machine validation',
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.claimsService.updateStatus(
      id,
      body.status as any,
      user.id,
      body.reason,
    );
  }

  /**
   * Upload claim document
   */
  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload claim document',
    description: 'Upload claim-related documents',
  })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(
    @Param('id') id: string,
    @Body()
    body: {
      filePath: string;
      fileName: string;
      documentType: string;
    },
  ) {
    return this.claimsService.uploadDocument(
      id,
      body.filePath,
      body.fileName,
      body.documentType,
    );
  }

  /**
   * Assign claim
   */
  @Patch(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Assign claim',
    description: 'Assign claim to internal team member',
  })
  @ApiResponse({ status: 200, description: 'Claim assigned' })
  async assignClaim(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.claimsService.assignClaim(id, body.userId);
  }

  /**
   * Appoint surveyor
   */
  @Post(':id/surveyor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Appoint surveyor',
    description: 'Appoint surveyor for motor claims',
  })
  @ApiResponse({ status: 200, description: 'Surveyor appointed' })
  async appointSurveyor(
    @Param('id') id: string,
    @Body() body: { name: string; phone: string },
  ) {
    return this.claimsService.appointSurveyor(id, body.name, body.phone);
  }

  /**
   * Approve claim
   */
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve claim',
    description: 'Approve claim with amount',
  })
  @ApiResponse({ status: 200, description: 'Claim approved' })
  async approveClaim(
    @Param('id') id: string,
    @Body() body: { approvedAmount: number },
    @CurrentUser() user: any,
  ) {
    return this.claimsService.approveClaim(id, body.approvedAmount, user.id);
  }

  /**
   * Reject claim
   */
  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject claim',
    description: 'Reject claim with reason',
  })
  @ApiResponse({ status: 200, description: 'Claim rejected' })
  async rejectClaim(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.claimsService.rejectClaim(id, body.reason, user.id);
  }

  /**
   * Settle claim
   */
  @Post(':id/settle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Settle claim',
    description: 'Mark claim as settled',
  })
  @ApiResponse({ status: 200, description: 'Claim settled' })
  async settleClaim(
    @Param('id') id: string,
    @Body() body: { settledAmount: number },
  ) {
    return this.claimsService.settleClaim(id, body.settledAmount);
  }
}
