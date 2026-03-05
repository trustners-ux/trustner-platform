import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SIPService } from './sip.service';
import { CreateSIPDto } from './dto/create-sip.dto';
import { UpdateSIPDto } from './dto/update-sip.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, SIPStatus, SIPFrequency } from '@prisma/client';

@ApiTags('SIP')
@Controller('sip')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class SIPController {
  constructor(private sipService: SIPService) {}

  /**
   * Create new SIP
   */
  @Post()
  @Roles(UserRole.SUB_BROKER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new SIP',
    description: 'Register a new Systematic Investment Plan',
  })
  @ApiResponse({
    status: 201,
    description: 'SIP created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: CreateSIPDto,
    @CurrentUser() user: any,
  ) {
    return this.sipService.create(createDto, user.subBrokerId);
  }

  /**
   * Get all SIPs
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SUB_BROKER)
  @ApiOperation({
    summary: 'Get all SIPs',
    description: 'List SIPs with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'SIPs list' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('clientId') clientId?: string,
    @Query('subBrokerId') subBrokerId?: string,
    @Query('status') status?: SIPStatus,
    @Query('frequency') frequency?: SIPFrequency,
    @CurrentUser() user: any,
  ) {
    const filters: any = {};

    if (clientId) filters.clientId = clientId;
    if (status) filters.status = status;
    if (frequency) filters.frequency = frequency;

    // Sub-brokers can only see their own SIPs
    if (user.role === UserRole.SUB_BROKER) {
      filters.subBrokerId = user.subBrokerId;
    } else if (subBrokerId) {
      filters.subBrokerId = subBrokerId;
    }

    return this.sipService.findAll(pagination, filters);
  }

  /**
   * Get single SIP
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get SIP details',
    description: 'Retrieve detailed information for a specific SIP',
  })
  @ApiResponse({ status: 200, description: 'SIP details' })
  @ApiResponse({ status: 404, description: 'SIP not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const sip = await this.sipService.findOne(id);

    // Check access permissions
    if (user.role === UserRole.SUB_BROKER && sip.subBrokerId !== user.subBrokerId) {
      throw new ForbiddenException(
        'You can only view SIPs from your sub-broker',
      );
    }

    return sip;
  }

  /**
   * Pause SIP
   */
  @Post(':id/pause')
  @Roles(UserRole.SUB_BROKER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause SIP',
    description: 'Temporarily pause an active SIP',
  })
  @ApiResponse({ status: 200, description: 'SIP paused' })
  @ApiResponse({ status: 400, description: 'Cannot pause SIP' })
  @ApiResponse({ status: 404, description: 'SIP not found' })
  async pause(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.sipService.pause(id, user.id);
  }

  /**
   * Resume SIP
   */
  @Post(':id/resume')
  @Roles(UserRole.SUB_BROKER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume SIP',
    description: 'Resume a paused SIP',
  })
  @ApiResponse({ status: 200, description: 'SIP resumed' })
  @ApiResponse({ status: 400, description: 'Cannot resume SIP' })
  @ApiResponse({ status: 404, description: 'SIP not found' })
  async resume(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.sipService.resume(id, user.id);
  }

  /**
   * Cancel SIP
   */
  @Post(':id/cancel')
  @Roles(UserRole.SUB_BROKER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel SIP',
    description: 'Cancel an active or paused SIP',
  })
  @ApiResponse({ status: 200, description: 'SIP cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel SIP' })
  @ApiResponse({ status: 404, description: 'SIP not found' })
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.sipService.cancel(id, body.reason, user.id);
  }

  /**
   * Get SIP installments
   */
  @Get(':id/installments')
  @ApiOperation({
    summary: 'Get SIP installments',
    description: 'List all installments for a specific SIP',
  })
  @ApiResponse({ status: 200, description: 'Installments list' })
  @ApiResponse({ status: 404, description: 'SIP not found' })
  async getInstallments(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: any,
  ) {
    return this.sipService.getInstallments(id, pagination);
  }

  /**
   * Get client SIPs
   */
  @Get('client/:clientId')
  @ApiOperation({
    summary: 'Get client SIPs',
    description: 'List all SIPs for a specific client',
  })
  @ApiResponse({ status: 200, description: 'Client SIPs list' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientSips(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.sipService.getClientSips(clientId);
  }

  /**
   * Get SIP summary
   */
  @Get('summary/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SUB_BROKER)
  @ApiOperation({
    summary: 'Get SIP summary',
    description: 'Get summary statistics for SIPs',
  })
  @ApiResponse({ status: 200, description: 'Summary data' })
  async getSummary(
    @Query('subBrokerId') subBrokerId?: string,
    @CurrentUser() user: any,
  ) {
    let targetSubBrokerId = subBrokerId;

    if (user.role === UserRole.SUB_BROKER) {
      targetSubBrokerId = user.subBrokerId;
    }

    return this.sipService.getSipSummary(targetSubBrokerId);
  }
}
