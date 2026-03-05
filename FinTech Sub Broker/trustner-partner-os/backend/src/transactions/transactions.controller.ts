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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, TransactionType, TransactionStatus } from '@prisma/client';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  /**
   * Create new transaction
   */
  @Post()
  @Roles(UserRole.SUB_BROKER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new transaction',
    description: 'Create a new investment transaction (LUMPSUM, SIP, etc.)',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: CreateTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.transactionsService.create(createDto, user.id);
  }

  /**
   * Get all transactions
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SUB_BROKER)
  @ApiOperation({
    summary: 'Get all transactions',
    description: 'List transactions with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Transactions list' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('clientId') clientId?: string,
    @Query('subBrokerId') subBrokerId?: string,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @CurrentUser() user: any,
  ) {
    const filters: any = {};

    if (clientId) filters.clientId = clientId;
    if (status) filters.status = status;
    if (type) filters.type = type;

    // Sub-brokers can only see their own transactions
    if (user.role === UserRole.SUB_BROKER) {
      filters.subBrokerId = user.subBrokerId;
    } else if (subBrokerId) {
      filters.subBrokerId = subBrokerId;
    }

    return this.transactionsService.findAll(pagination, filters);
  }

  /**
   * Get single transaction
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction details',
    description: 'Retrieve detailed information for a specific transaction',
  })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const transaction = await this.transactionsService.findOne(id);

    // Check access permissions
    if (
      user.role === UserRole.SUB_BROKER &&
      transaction.subBrokerId !== user.subBrokerId
    ) {
      throw new ForbiddenException(
        'You can only view transactions from your sub-broker',
      );
    }

    return transaction;
  }

  /**
   * Update transaction status
   */
  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update transaction status',
    description: 'Update transaction status with details',
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.transactionsService.updateStatus(id, dto.status, {
      bseOrderId: dto.bseOrderId,
      allotmentNav: dto.allotmentNav,
      allotmentUnits: dto.allotmentUnits,
      remarks: dto.remarks,
      failureReason: dto.failureReason,
    });
  }

  /**
   * Get client transactions
   */
  @Get('client/:clientId')
  @ApiOperation({
    summary: 'Get client transactions',
    description: 'List all transactions for a specific client',
  })
  @ApiResponse({ status: 200, description: 'Client transactions list' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientTransactions(
    @Param('clientId') clientId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: any,
  ) {
    // Access control can be added based on sub-broker relationship
    return this.transactionsService.getClientTransactions(clientId, pagination);
  }

  /**
   * Cancel transaction
   */
  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SUB_BROKER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel transaction',
    description: 'Cancel a pending or initiated transaction',
  })
  @ApiResponse({ status: 200, description: 'Transaction cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.transactionsService.cancel(id, user.id);
  }

  /**
   * Get transaction summary
   */
  @Get('summary/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SUB_BROKER)
  @ApiOperation({
    summary: 'Get transaction summary',
    description: 'Get summary statistics for transactions',
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

    return this.transactionsService.getTransactionSummary(targetSubBrokerId);
  }
}
