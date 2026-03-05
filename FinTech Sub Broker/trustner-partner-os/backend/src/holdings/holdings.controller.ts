import {
  Controller,
  Get,
  Post,
  Patch,
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
import { HoldingsService } from './holdings.service';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Holdings')
@Controller('holdings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class HoldingsController {
  constructor(private holdingsService: HoldingsService) {}

  /**
   * Get client holdings
   */
  @Get('client/:clientId')
  @ApiOperation({
    summary: 'Get client holdings',
    description: 'Retrieve all holdings for a specific client',
  })
  @ApiResponse({
    status: 200,
    description: 'Client holdings list',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientHoldings(
    @Param('clientId') clientId: string,
    @Query('category') category?: string,
    @CurrentUser() user: any,
  ) {
    // Access control can be implemented based on sub-broker relationship
    return this.holdingsService.getClientHoldings(clientId, {
      category,
    });
  }

  /**
   * Get holding details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get holding details',
    description: 'Retrieve detailed information for a specific holding',
  })
  @ApiResponse({
    status: 200,
    description: 'Holding details',
  })
  @ApiResponse({ status: 404, description: 'Holding not found' })
  async getHoldingDetail(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.holdingsService.getHoldingDetail(id);
  }

  /**
   * Update holding NAV
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Update holding',
    description: 'Update holding NAV and returns data',
  })
  @ApiResponse({ status: 200, description: 'Holding updated' })
  @ApiResponse({ status: 404, description: 'Holding not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateHolding(
    @Param('id') id: string,
    @Body() dto: UpdateHoldingDto,
    @CurrentUser() user: any,
  ) {
    return this.holdingsService.updateHolding(id, dto);
  }

  /**
   * Get client portfolio summary
   */
  @Get('portfolio/:clientId')
  @ApiOperation({
    summary: 'Get portfolio summary',
    description: 'Get portfolio summary for a client with category breakdown',
  })
  @ApiResponse({ status: 200, description: 'Portfolio summary' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getPortfolioSummary(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.holdingsService.getPortfolioSummary(clientId);
  }

  /**
   * Get sub-broker AUM
   */
  @Get('aum/:subBrokerId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.SUB_BROKER)
  @ApiOperation({
    summary: 'Get sub-broker AUM',
    description: 'Get total AUM and statistics for a sub-broker',
  })
  @ApiResponse({ status: 200, description: 'AUM data' })
  async getSubBrokerAUM(
    @Param('subBrokerId') subBrokerId: string,
    @CurrentUser() user: any,
  ) {
    // Sub-brokers can only view their own AUM
    if (user.role === UserRole.SUB_BROKER && user.subBrokerId !== subBrokerId) {
      throw new ForbiddenException(
        'You can only view your own AUM statistics',
      );
    }

    return this.holdingsService.getSubBrokerAUM(subBrokerId);
  }

  /**
   * Refresh NAV for scheme
   */
  @Post('refresh-nav')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh NAV',
    description: 'Update NAV for a scheme and recalculate all holdings',
  })
  @ApiResponse({ status: 200, description: 'NAV refreshed' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async refreshNav(
    @Body() body: { schemeId: string; nav: string; navDate: string },
    @CurrentUser() user: any,
  ) {
    const navDate = new Date(body.navDate);
    return this.holdingsService.refreshNav(body.schemeId, body.nav, navDate);
  }

  /**
   * Get scheme holders
   */
  @Get('scheme/:schemeId/holders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get scheme holders',
    description: 'List all clients holding a specific scheme',
  })
  @ApiResponse({ status: 200, description: 'Holders list' })
  @ApiResponse({ status: 404, description: 'Scheme not found' })
  async getSchemeHolders(
    @Param('schemeId') schemeId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: any,
  ) {
    return this.holdingsService.getSchemeHolders(schemeId, pagination);
  }
}
