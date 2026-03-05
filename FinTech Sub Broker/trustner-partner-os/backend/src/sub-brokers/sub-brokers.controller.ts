import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
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
import { SubBrokersService } from './sub-brokers.service';
import { CreateSubBrokerDto } from './dto/create-sub-broker.dto';
import { UpdateSubBrokerDto } from './dto/update-sub-broker.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, SubBrokerStatus } from '@prisma/client';

@ApiTags('Sub-Brokers')
@Controller('sub-brokers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class SubBrokersController {
  constructor(private subBrokersService: SubBrokersService) {}

  /**
   * Create new sub-broker
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new sub-broker',
    description: 'Register a new sub-broker on the platform',
  })
  @ApiResponse({
    status: 201,
    description: 'Sub-broker created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: CreateSubBrokerDto,
    @CurrentUser() user: any,
  ) {
    return this.subBrokersService.create(createDto, user.id);
  }

  /**
   * Get all sub-brokers
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.REGIONAL_HEAD)
  @ApiOperation({
    summary: 'Get all sub-brokers',
    description: 'List all sub-brokers with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Sub-brokers list' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: SubBrokerStatus,
    @Query('branch') branch?: string,
    @Query('search') search?: string,
    @CurrentUser() user: any,
  ) {
    const filters: any = {};

    if (status) filters.status = status;
    if (branch) filters.branch = branch;
    if (search) filters.search = search;

    // Regional heads can only see their sub-brokers
    if (user.role === UserRole.REGIONAL_HEAD) {
      filters.regionalHeadId = user.id;
    }

    return this.subBrokersService.findAll(pagination, filters);
  }

  /**
   * Get single sub-broker details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get sub-broker details',
    description: 'Retrieve detailed information for a specific sub-broker',
  })
  @ApiResponse({ status: 200, description: 'Sub-broker details' })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // Check access permissions
    if (user.role === UserRole.SUB_BROKER && user.subBrokerId !== id) {
      throw new ForbiddenException('You can only view your own sub-broker profile');
    }

    return this.subBrokersService.findOne(id);
  }

  /**
   * Update sub-broker information
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update sub-broker',
    description: 'Update sub-broker information',
  })
  @ApiResponse({ status: 200, description: 'Sub-broker updated' })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubBrokerDto,
    @CurrentUser() user: any,
  ) {
    return this.subBrokersService.update(id, updateDto, user.id);
  }

  /**
   * Approve sub-broker
   */
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve sub-broker',
    description: 'Approve a pending sub-broker application',
  })
  @ApiResponse({ status: 200, description: 'Sub-broker approved' })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async approve(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.subBrokersService.approve(id, user.id, body.notes);
  }

  /**
   * Suspend sub-broker
   */
  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspend sub-broker',
    description: 'Suspend a sub-broker account',
  })
  @ApiResponse({ status: 200, description: 'Sub-broker suspended' })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async suspend(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.subBrokersService.suspend(id, body.reason, user.id);
  }

  /**
   * Get sub-broker performance metrics
   */
  @Get(':id/performance')
  @ApiOperation({
    summary: 'Get sub-broker performance',
    description: 'Get AUM, SIP book, clients, and commission metrics',
  })
  @ApiResponse({ status: 200, description: 'Performance metrics' })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  async getPerformance(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.SUB_BROKER && user.subBrokerId !== id) {
      throw new ForbiddenException('You can only view your own performance');
    }

    return this.subBrokersService.getPerformance(id);
  }

  /**
   * Get sub-broker's clients
   */
  @Get(':id/clients')
  @ApiOperation({
    summary: 'Get sub-broker clients',
    description: 'List all clients of a sub-broker',
  })
  @ApiResponse({ status: 200, description: 'Clients list' })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  async getClients(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.SUB_BROKER && user.subBrokerId !== id) {
      throw new ForbiddenException('You can only view your own clients');
    }

    // TODO: Implement client listing with pagination
    return { message: 'Not yet implemented' };
  }

  /**
   * Get sub-broker commissions
   */
  @Get(':id/commissions')
  @ApiOperation({
    summary: 'Get sub-broker commissions',
    description: 'Get commission history for a sub-broker',
  })
  @ApiResponse({ status: 200, description: 'Commissions list' })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  async getCommissions(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.SUB_BROKER && user.subBrokerId !== id) {
      throw new ForbiddenException('You can only view your own commissions');
    }

    // TODO: Implement commission listing with pagination
    return { message: 'Not yet implemented' };
  }
}
