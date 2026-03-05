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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Lead Management')
@Controller('insurance/leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  /**
   * Create new lead
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new lead',
    description: 'Create insurance lead with LEAD-INS-YYYYMMDD-XXXXX code',
  })
  @ApiResponse({
    status: 201,
    description: 'Lead created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() createDto: CreateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.createLead(createDto);
  }

  /**
   * Get all leads with filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get all leads',
    description:
      'List leads with pagination, filters by POSP, status, LOB, source',
  })
  @ApiResponse({ status: 200, description: 'Leads list with pagination' })
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('pospId') pospId?: string,
    @Query('status') status?: string,
    @Query('lob') lob?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.leadsService.findAll(
      {
        skip: parseInt(skip),
        take: parseInt(take),
      },
      {
        pospId,
        status: status as any,
        lob: lob as any,
        source: source as any,
        search,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      },
    );
  }

  /**
   * Get single lead
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get lead details',
    description: 'Get full lead profile with activities and quotes',
  })
  @ApiResponse({ status: 200, description: 'Lead details' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  /**
   * Update lead
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update lead',
    description: 'Update lead contact and vehicle details',
  })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async updateLead(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateLeadDto>,
  ) {
    return this.leadsService.updateLead(id, updateDto);
  }

  /**
   * Update lead status
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update lead status',
    description: 'Change lead status with reason tracking',
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.leadsService.updateStatus(id, body.status as any, body.reason);
  }

  /**
   * Assign lead to POSP
   */
  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign lead to POSP',
    description: 'Assign lead to insurance agent',
  })
  @ApiResponse({ status: 200, description: 'Lead assigned' })
  async assignLead(
    @Param('id') id: string,
    @Body() body: { pospId: string },
  ) {
    return this.leadsService.assignLead(id, body.pospId);
  }

  /**
   * Add activity to lead
   */
  @Post(':id/activity')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add activity',
    description: 'Log action on lead (call, email, quote shared, etc)',
  })
  @ApiResponse({ status: 201, description: 'Activity added' })
  async addActivity(
    @Param('id') id: string,
    @Body() body: { action: string; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.leadsService.addActivity(
      id,
      body.action,
      body.description,
      user.id,
    );
  }

  /**
   * Add quote to lead
   */
  @Post(':id/quotes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add quote to lead',
    description: 'Add insurance quote from insurer',
  })
  @ApiResponse({ status: 201, description: 'Quote added' })
  async addQuote(
    @Param('id') id: string,
    @Body()
    quoteDto: {
      insurerName: string;
      productName: string;
      sumInsured: number;
      premium: number;
      gst: number;
      totalPremium: number;
      coverageDetails?: any;
      addOns?: any;
      quoteRefId?: string;
      validTill?: string;
    },
  ) {
    return this.leadsService.addQuote(id, quoteDto);
  }

  /**
   * Select quote
   */
  @Post(':id/quotes/:quoteId/select')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Select quote',
    description: 'Mark quote as selected for proposal generation',
  })
  @ApiResponse({ status: 200, description: 'Quote selected' })
  async selectQuote(
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.leadsService.selectQuote(id, quoteId);
  }

  /**
   * Convert lead to policy
   */
  @Post(':id/convert-to-policy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Convert lead to policy',
    description: 'Create policy from converted lead',
  })
  @ApiResponse({ status: 201, description: 'Policy created' })
  async convertToPolicy(@Param('id') id: string) {
    return this.leadsService.convertToPolicy(id);
  }

  /**
   * Get lead analytics
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get lead analytics',
    description: 'Conversion rates, source distribution, LOB breakdown',
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getLeadAnalytics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('lob') lob?: string,
  ) {
    return this.leadsService.getLeadAnalytics({
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      lob: lob as any,
    });
  }

  /**
   * Get follow-ups for today
   */
  @Get(':pospId/follow-ups')
  @ApiOperation({
    summary: "Get today's follow-ups",
    description: "Get all follow-ups for POSP today",
  })
  @ApiResponse({ status: 200, description: 'Follow-ups list' })
  async getFollowUps(
    @Param('pospId') pospId: string,
    @Query('date') date?: string,
  ) {
    return this.leadsService.getFollowUps(
      pospId,
      date ? new Date(date) : new Date(),
    );
  }
}
