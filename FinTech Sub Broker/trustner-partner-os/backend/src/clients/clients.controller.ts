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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AddBankAccountDto } from './dto/add-bank-account.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, KYCStatus } from '@prisma/client';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  /**
   * Create new client
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUB_BROKER, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new client',
    description: 'Register a new client under a sub-broker',
  })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate email' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: CreateClientDto,
    @CurrentUser() user: any,
  ) {
    return this.clientsService.create(createDto, user.id);
  }

  /**
   * Get all clients with filters and pagination
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.FINANCE_ADMIN, UserRole.SUB_BROKER)
  @ApiOperation({
    summary: 'Get all clients',
    description: 'List all clients with pagination and optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of clients retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('subBrokerId') subBrokerId?: string,
    @Query('kycStatus') kycStatus?: KYCStatus,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user: any,
  ) {
    const filters: any = {};

    // Sub-brokers can only see their own clients
    if (user.role === UserRole.SUB_BROKER) {
      filters.subBrokerId = user.subBrokerId;
    } else if (subBrokerId) {
      filters.subBrokerId = subBrokerId;
    }

    if (kycStatus) filters.kycStatus = kycStatus;
    if (status) filters.status = status;
    if (search) filters.search = search;

    return this.clientsService.findAll(pagination, filters);
  }

  /**
   * Get client by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get client details',
    description: 'Retrieve detailed information for a specific client',
  })
  @ApiResponse({
    status: 200,
    description: 'Client details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  /**
   * Update client information
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SUB_BROKER)
  @ApiOperation({
    summary: 'Update client information',
    description: 'Update client profile, occupation, income, and address information',
  })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateClientDto,
    @CurrentUser() user: any,
  ) {
    // Sub-brokers can only update their own clients
    if (user.role === UserRole.SUB_BROKER) {
      const client = await this.clientsService.findOne(id);
      if (client.subBrokerId !== user.subBrokerId) {
        throw new Error('Unauthorized to update this client');
      }
    }

    return this.clientsService.update(id, updateDto);
  }

  /**
   * Update client KYC status
   */
  @Post(':id/kyc-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update client KYC status',
    description: 'Update KYC verification status for client (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async updateKycStatus(
    @Param('id') id: string,
    @Body('kycStatus') kycStatus: KYCStatus,
  ) {
    return this.clientsService.updateKycStatus(id, kycStatus);
  }

  /**
   * Add bank account for client
   */
  @Post(':id/bank-accounts')
  @ApiOperation({
    summary: 'Add bank account',
    description: 'Add a bank account for client (for transactions and disbursements)',
  })
  @ApiResponse({
    status: 201,
    description: 'Bank account added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async addBankAccount(
    @Param('id') clientId: string,
    @Body() addAccountDto: AddBankAccountDto,
  ) {
    return this.clientsService.addBankAccount(clientId, addAccountDto);
  }

  /**
   * Get bank accounts for client
   */
  @Get(':id/bank-accounts')
  @ApiOperation({
    summary: 'Get client bank accounts',
    description: 'Retrieve all bank accounts associated with the client',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank accounts retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getBankAccounts(@Param('id') clientId: string) {
    return this.clientsService.getBankAccounts(clientId);
  }

  /**
   * Get client portfolio summary
   */
  @Get(':id/portfolio')
  @ApiOperation({
    summary: 'Get portfolio summary',
    description: 'Retrieve client portfolio summary including holdings, SIPs, and investments',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio summary retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getPortfolioSummary(@Param('id') clientId: string) {
    return this.clientsService.getPortfolioSummary(clientId);
  }
}
