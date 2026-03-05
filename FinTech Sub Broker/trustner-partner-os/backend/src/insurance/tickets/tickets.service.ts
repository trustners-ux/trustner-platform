import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketStatus, TicketPriority } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Support Tickets Service
 * Manages customer and POSP support tickets
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger('TicketsService');

  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique ticket code
   * Format: TKT-YYYYMMDD-XXXXX
   */
  private async generateTicketCode(): Promise<string> {
    const datePrefix = dayjs().format('YYYYMMDD');
    const count = await this.prisma.supportTicket.count({
      where: {
        ticketCode: { startsWith: `TKT-${datePrefix}` },
      },
    });
    const seqNum = String(count + 1).padStart(5, '0');
    return `TKT-${datePrefix}-${seqNum}`;
  }

  /**
   * Create ticket
   */
  async createTicket(ticketDto: {
    pospId?: string;
    customerId?: string;
    policyNumber?: string;
    category: string;
    priority: TicketPriority;
    subject: string;
    description: string;
  }): Promise<any> {
    try {
      const ticketCode = await this.generateTicketCode();

      const ticket = await this.prisma.supportTicket.create({
        data: {
          ticketCode,
          pospId: ticketDto.pospId,
          customerId: ticketDto.customerId,
          policyNumber: ticketDto.policyNumber,
          category: ticketDto.category as any,
          priority: ticketDto.priority,
          status: TicketStatus.OPEN,
          subject: ticketDto.subject,
          description: ticketDto.description,
          slaDeadline: dayjs()
            .add(ticketDto.priority === TicketPriority.URGENT ? 4 : 24, 'hours')
            .toDate(),
        },
      });

      this.logger.log(`✓ Ticket created: ${ticketCode}`);
      return ticket;
    } catch (error) {
      this.logger.error(`Error creating ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all tickets with filters
   */
  async findAll(
    pagination: { skip: number; take: number },
    filters: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: string;
      assignedToUserId?: string;
      pospId?: string;
    },
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.category) where.category = filters.category;
      if (filters.assignedToUserId) where.assignedToUserId = filters.assignedToUserId;
      if (filters.pospId) where.pospId = filters.pospId;

      const [data, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
          include: {
            posp: { select: { agentCode: true, firstName: true, lastName: true } },
            _count: { select: { comments: true } },
          },
        }),
        this.prisma.supportTicket.count({ where }),
      ]);

      return {
        data,
        pagination: {
          total,
          skip: pagination.skip,
          take: pagination.take,
          pages: Math.ceil(total / pagination.take),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single ticket with comments
   */
  async findOne(id: string): Promise<any> {
    try {
      const ticket = await this.prisma.supportTicket.findUniqueOrThrow({
        where: { id },
        include: {
          comments: { orderBy: { createdAt: 'desc' } },
          posp: true,
        },
      });

      return ticket;
    } catch (error) {
      this.logger.error(`Error fetching ticket: ${error.message}`);
      if (error.code === 'P2025') {
        throw new NotFoundException('Ticket not found');
      }
      throw error;
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(id: string, updateDto: { subject?: string; description?: string }): Promise<any> {
    try {
      await this.findOne(id);

      const ticket = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          subject: updateDto.subject,
          description: updateDto.description,
        },
      });

      return ticket;
    } catch (error) {
      this.logger.error(`Error updating ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign ticket
   */
  async assignTicket(id: string, userId: string): Promise<any> {
    try {
      const ticket = await this.findOne(id);

      const updated = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          assignedToUserId: userId,
          status: TicketStatus.ASSIGNED,
        },
      });

      this.logger.log(`✓ Ticket assigned: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error assigning ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add comment
   */
  async addComment(ticketId: string, authorId: string, authorName: string, content: string, isInternal: boolean): Promise<any> {
    try {
      await this.findOne(ticketId);

      const comment = await this.prisma.ticketComment.create({
        data: {
          ticketId,
          authorId,
          authorName,
          content,
          isInternal,
        },
      });

      this.logger.log(`✓ Comment added to ticket: ${ticketId}`);
      return comment;
    } catch (error) {
      this.logger.error(`Error adding comment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(id: string, resolution: string, resolvedBy: string): Promise<any> {
    try {
      const ticket = await this.findOne(id);

      const updated = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          status: TicketStatus.RESOLVED,
          resolution,
          resolvedBy,
          resolvedAt: new Date(),
        },
      });

      this.logger.log(`✓ Ticket resolved: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error resolving ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reopen ticket
   */
  async reopenTicket(id: string, reason: string): Promise<any> {
    try {
      const ticket = await this.findOne(id);

      const updated = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          status: TicketStatus.REOPENED,
          resolution: null,
          resolvedBy: null,
          resolvedAt: null,
        },
      });

      // Add comment
      await this.addComment(id, 'SYSTEM', 'System', `Reopened: ${reason}`, true);

      this.logger.log(`✓ Ticket reopened: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error reopening ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get ticket analytics
   */
  async getTicketAnalytics(): Promise<any> {
    try {
      const [
        totalTickets,
        openCount,
        resolvedCount,
        closedCount,
        byStatus,
        byCategory,
        byPriority,
      ] = await Promise.all([
        this.prisma.supportTicket.count(),
        this.prisma.supportTicket.count({
          where: { status: { in: [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS] } },
        }),
        this.prisma.supportTicket.count({
          where: { status: TicketStatus.RESOLVED },
        }),
        this.prisma.supportTicket.count({
          where: { status: TicketStatus.CLOSED },
        }),
        this.prisma.supportTicket.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        this.prisma.supportTicket.groupBy({
          by: ['category'],
          _count: { id: true },
        }),
        this.prisma.supportTicket.groupBy({
          by: ['priority'],
          _count: { id: true },
        }),
      ]);

      return {
        summary: {
          totalTickets,
          openCount,
          resolvedCount,
          closedCount,
          resolutionRate:
            totalTickets > 0
              ? ((resolvedCount / totalTickets) * 100).toFixed(2)
              : 0,
        },
        byStatus,
        byCategory,
        byPriority,
      };
    } catch (error) {
      this.logger.error(`Error fetching ticket analytics: ${error.message}`);
      throw error;
    }
  }
}
