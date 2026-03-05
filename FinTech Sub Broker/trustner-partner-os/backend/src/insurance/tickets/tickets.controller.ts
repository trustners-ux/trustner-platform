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
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Insurance - Support Tickets')
@Controller('insurance/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  /**
   * Create ticket
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create support ticket',
    description: 'Create new support ticket with TKT-YYYYMMDD-XXXXX code',
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket created',
  })
  async createTicket(
    @Body()
    ticketDto: {
      pospId?: string;
      customerId?: string;
      policyNumber?: string;
      category: string;
      priority: string;
      subject: string;
      description: string;
    },
  ) {
    return this.ticketsService.createTicket({
      ...ticketDto,
      priority: ticketDto.priority as any,
    });
  }

  /**
   * Get all tickets
   */
  @Get()
  @ApiOperation({
    summary: 'Get all tickets',
    description: 'List tickets with filters by status, priority, category',
  })
  @ApiResponse({ status: 200, description: 'Tickets list' })
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('pospId') pospId?: string,
  ) {
    return this.ticketsService.findAll(
      {
        skip: parseInt(skip),
        take: parseInt(take),
      },
      {
        status: status as any,
        priority: priority as any,
        category,
        assignedToUserId,
        pospId,
      },
    );
  }

  /**
   * Get single ticket
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get ticket details',
    description: 'Get ticket with all comments',
  })
  @ApiResponse({ status: 200, description: 'Ticket details' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  /**
   * Update ticket
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update ticket',
    description: 'Update ticket subject and description',
  })
  @ApiResponse({ status: 200, description: 'Updated' })
  async updateTicket(
    @Param('id') id: string,
    @Body() updateDto: { subject?: string; description?: string },
  ) {
    return this.ticketsService.updateTicket(id, updateDto);
  }

  /**
   * Assign ticket
   */
  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign ticket',
    description: 'Assign ticket to team member',
  })
  @ApiResponse({ status: 200, description: 'Assigned' })
  async assignTicket(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.ticketsService.assignTicket(id, body.userId);
  }

  /**
   * Add comment
   */
  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add comment',
    description: 'Add comment to ticket',
  })
  @ApiResponse({ status: 201, description: 'Comment added' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string; isInternal?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.addComment(
      id,
      user.id,
      user.name || 'Unknown',
      body.content,
      body.isInternal || false,
    );
  }

  /**
   * Resolve ticket
   */
  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve ticket',
    description: 'Mark ticket as resolved',
  })
  @ApiResponse({ status: 200, description: 'Resolved' })
  async resolveTicket(
    @Param('id') id: string,
    @Body() body: { resolution: string },
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.resolveTicket(id, body.resolution, user.id);
  }

  /**
   * Reopen ticket
   */
  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reopen ticket',
    description: 'Reopen a resolved/closed ticket',
  })
  @ApiResponse({ status: 200, description: 'Reopened' })
  async reopenTicket(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.ticketsService.reopenTicket(id, body.reason);
  }

  /**
   * Get ticket analytics
   */
  @Get('analytics/overview')
  @ApiOperation({
    summary: 'Get ticket analytics',
    description: 'Get analytics by status, category, and priority',
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getTicketAnalytics() {
    return this.ticketsService.getTicketAnalytics();
  }
}
