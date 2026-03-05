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
import { EndorsementsService } from './endorsements.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Endorsements')
@Controller('insurance/endorsements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class EndorsementsController {
  constructor(private endorsementsService: EndorsementsService) {}

  /**
   * Create endorsement
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create endorsement',
    description:
      'Create policy endorsement (amendment) with END-YYYYMMDD-XXXXX code',
  })
  @ApiResponse({
    status: 201,
    description: 'Endorsement created successfully',
  })
  async create(
    @Body()
    endorsementDto: {
      policyId: string;
      type: string;
      description: string;
      oldValues?: any;
      newValues?: any;
      premiumDifference?: number;
    },
    @CurrentUser() user: any,
  ) {
    return this.endorsementsService.createEndorsement({
      ...endorsementDto,
      requestedBy: user.id,
    });
  }

  /**
   * Get all endorsements
   */
  @Get()
  @ApiOperation({
    summary: 'Get all endorsements',
    description: 'List endorsements with filters',
  })
  @ApiResponse({ status: 200, description: 'Endorsements list' })
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('policyId') policyId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.endorsementsService.findAll(
      {
        skip: parseInt(skip),
        take: parseInt(take),
      },
      {
        policyId,
        status: status as any,
        type: type as any,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      },
    );
  }

  /**
   * Get single endorsement
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get endorsement details',
    description: 'Get full endorsement with documents and status history',
  })
  @ApiResponse({ status: 200, description: 'Endorsement details' })
  @ApiResponse({ status: 404, description: 'Endorsement not found' })
  async findOne(@Param('id') id: string) {
    return this.endorsementsService.findOne(id);
  }

  /**
   * Update endorsement status
   */
  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update endorsement status',
    description: 'Change endorsement status',
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.endorsementsService.updateStatus(
      id,
      body.status as any,
      user.id,
      body.reason,
    );
  }

  /**
   * Upload endorsement document
   */
  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload endorsement document',
    description: 'Upload supporting documents',
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
    return this.endorsementsService.uploadDocument(
      id,
      body.filePath,
      body.fileName,
      body.documentType,
    );
  }

  /**
   * Assign endorsement
   */
  @Patch(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Assign endorsement',
    description: 'Assign endorsement to team member',
  })
  @ApiResponse({ status: 200, description: 'Assigned' })
  async assignEndorsement(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.endorsementsService.assignEndorsement(id, body.userId);
  }

  /**
   * Process endorsement
   */
  @Post(':id/process')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process endorsement',
    description: 'Process endorsement with premium difference',
  })
  @ApiResponse({ status: 200, description: 'Processed' })
  async processEndorsement(
    @Param('id') id: string,
    @Body() body: { premiumDifference?: number },
    @CurrentUser() user: any,
  ) {
    return this.endorsementsService.processEndorsement(
      id,
      user.id,
      body.premiumDifference,
    );
  }

  /**
   * Get endorsement analytics
   */
  @Get('analytics/overview')
  @ApiOperation({
    summary: 'Get endorsement analytics',
    description: 'Get analytics by type and status',
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getEndorsementAnalytics() {
    return this.endorsementsService.getEndorsementAnalytics();
  }
}
