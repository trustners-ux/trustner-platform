import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class PayoutsController {
  constructor(private payoutsService: PayoutsService) {}

  /**
   * Generate payout from commissions
   */
  @Post('generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate payout',
    description: 'Create a new payout by aggregating commissions for a period',
  })
  @ApiResponse({
    status: 201,
    description: 'Payout generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or payout exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async generate(
    @Body() createDto: CreatePayoutDto,
    @CurrentUser() user: any,
  ) {
    return this.payoutsService.generate(createDto, user.id);
  }

  /**
   * Get all payouts
   */
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get all payouts',
    description: 'List all payouts with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Payouts list' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('subBrokerId') subBrokerId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @CurrentUser() user: any,
  ) {
    const filters: any = {};
    if (subBrokerId) filters.subBrokerId = subBrokerId;
    if (status) filters.status = status;
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);

    return this.payoutsService.findAll(pagination, filters);
  }

  /**
   * Get payout details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get payout details',
    description: 'Retrieve detailed information for a specific payout',
  })
  @ApiResponse({ status: 200, description: 'Payout details' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.payoutsService.findOne(id);
  }

  /**
   * Approve payout
   */
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve payout',
    description: 'Approve a pending payout for payment processing',
  })
  @ApiResponse({ status: 200, description: 'Payout approved' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  @ApiResponse({ status: 400, description: 'Payout cannot be approved' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.payoutsService.approve(id, user.id);
  }

  /**
   * Mark payout as paid
   */
  @Post(':id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark payout as paid',
    description: 'Mark a payout as paid and add bank reference',
  })
  @ApiResponse({ status: 200, description: 'Payout marked as paid' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  @ApiResponse({ status: 400, description: 'Invalid payout status' })
  async markPaid(
    @Param('id') id: string,
    @Body() body: { bankRefNumber: string },
    @CurrentUser() user: any,
  ) {
    return this.payoutsService.markPaid(id, body.bankRefNumber, user.id);
  }

  /**
   * Put payout on hold
   */
  @Post(':id/hold')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Put payout on hold',
    description: 'Put a payout on hold with reason',
  })
  @ApiResponse({ status: 200, description: 'Payout put on hold' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  @ApiResponse({ status: 400, description: 'Invalid payout status' })
  async hold(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.payoutsService.putOnHold(id, body.reason, user.id);
  }

  /**
   * Get payouts for partner
   */
  @Get('partner/:subBrokerId')
  @ApiOperation({
    summary: 'Get partner payouts',
    description: 'Get all payouts for a specific sub-broker',
  })
  @ApiResponse({ status: 200, description: 'Partner payouts' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getPartnerPayouts(
    @Param('subBrokerId') subBrokerId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: any,
  ) {
    if (
      user.role === UserRole.SUB_BROKER &&
      user.subBrokerId !== subBrokerId
    ) {
      throw new ForbiddenException('You can only view your own payouts');
    }

    return this.payoutsService.getSubBrokerPayouts(subBrokerId, pagination);
  }

  /**
   * Get payout summary
   */
  @Get('summary/statistics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.COMPLIANCE_ADMIN,
  )
  @ApiOperation({
    summary: 'Get payout summary',
    description: 'Get payout statistics for a period',
  })
  @ApiResponse({ status: 200, description: 'Payout summary' })
  async getSummary(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @CurrentUser() user: any,
  ) {
    return this.payoutsService.getPayoutSummary(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }
}
