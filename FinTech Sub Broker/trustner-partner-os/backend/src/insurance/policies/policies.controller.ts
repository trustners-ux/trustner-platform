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
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Policy Management')
@Controller('insurance/policies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  /**
   * Create new policy
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new policy',
    description: 'Create policy from quote with TIBPL-POL-YYYYMMDD-XXXXX code',
  })
  @ApiResponse({
    status: 201,
    description: 'Policy created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() createDto: CreatePolicyDto,
    @CurrentUser() user: any,
  ) {
    return this.policiesService.createPolicy(createDto);
  }

  /**
   * Get all policies with filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get all policies',
    description:
      'List policies with pagination, filters by POSP, company, LOB, status, date range',
  })
  @ApiResponse({ status: 200, description: 'Policies list with pagination' })
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('pospId') pospId?: string,
    @Query('companyId') companyId?: string,
    @Query('lob') lob?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.policiesService.findAll(
      {
        skip: parseInt(skip),
        take: parseInt(take),
      },
      {
        pospId,
        companyId,
        lob: lob as any,
        status: status as any,
        search,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      },
    );
  }

  /**
   * Get single policy
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get policy details',
    description:
      'Get full policy details with endorsements, claims, commissions, documents, status history',
  })
  @ApiResponse({ status: 200, description: 'Policy details' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  /**
   * Update policy
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update policy',
    description: 'Update policy customer and nominee details',
  })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async updatePolicy(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreatePolicyDto>,
  ) {
    return this.policiesService.updatePolicy(id, updateDto);
  }

  /**
   * Update policy status with state machine validation
   */
  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update policy status',
    description:
      'Change policy status with state machine validation (QUOTE_GENERATED -> PROPOSAL_SUBMITTED -> PAYMENT_PENDING -> POLICY_ISSUED -> POLICY_ACTIVE)',
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.policiesService.updateStatus(
      id,
      body.status as any,
      user.id,
      body.reason,
    );
  }

  /**
   * Upload policy document
   */
  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload policy document',
    description:
      'Upload documents like proposal, policy copy, ID proof, address proof, vehicle RC, medical report, payment receipt',
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
    return this.policiesService.uploadDocument(
      id,
      body.filePath,
      body.fileName,
      body.documentType,
    );
  }

  /**
   * Tag BQP
   */
  @Patch(':id/tag-bqp')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Tag BQP to policy',
    description: 'Tag Business Query Person for IRDAI compliance',
  })
  @ApiResponse({ status: 200, description: 'BQP tagged' })
  async tagBQP(
    @Param('id') id: string,
    @Body() body: { bqpCode: string },
  ) {
    return this.policiesService.tagBQP(id, body.bqpCode);
  }

  /**
   * Tag SP
   */
  @Patch(':id/tag-sp')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Tag SP to policy',
    description: 'Tag Sales Person for IRDAI compliance',
  })
  @ApiResponse({ status: 200, description: 'SP tagged' })
  async tagSP(
    @Param('id') id: string,
    @Body() body: { spCode: string },
  ) {
    return this.policiesService.tagSP(id, body.spCode);
  }

  /**
   * Get policy timeline
   */
  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Get policy status timeline',
    description: 'Get complete status history as timeline',
  })
  @ApiResponse({ status: 200, description: 'Timeline data' })
  async getPolicyTimeline(@Param('id') id: string) {
    return this.policiesService.getPolicyTimeline(id);
  }

  /**
   * Get bulk policies
   */
  @Get('export/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get bulk policies for export',
    description: 'Fetch multiple policies for MIS export',
  })
  @ApiResponse({ status: 200, description: 'Bulk policies data' })
  async getBulkPolicies(
    @Query('pospId') pospId?: string,
    @Query('companyId') companyId?: string,
    @Query('lob') lob?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.policiesService.getBulkPolicies({
      pospId,
      companyId,
      lob: lob as any,
      status: status as any,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  /**
   * Get expiring policies
   */
  @Get('renewal/expiring')
  @ApiOperation({
    summary: 'Get expiring policies',
    description: 'Get policies expiring in specified number of days for renewal management',
  })
  @ApiResponse({ status: 200, description: 'Expiring policies list' })
  async getExpiringPolicies(@Query('days') days: string = '90') {
    return this.policiesService.getExpiringPolicies(parseInt(days));
  }

  /**
   * Get policy statistics
   */
  @Get('stats/overview')
  @ApiOperation({
    summary: 'Get policy statistics',
    description: 'Get total policies, active count, expired count, cancelled count, total premium',
  })
  @ApiResponse({ status: 200, description: 'Statistics data' })
  async getStatistics() {
    return this.policiesService.getStatistics();
  }
}
