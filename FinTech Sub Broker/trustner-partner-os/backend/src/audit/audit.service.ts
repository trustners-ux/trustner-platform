import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(private prismaService: PrismaService) {}

  async log(action: AuditAction, entity: string, entityId?: string, userId?: string, data?: any): Promise<any> {
    try {
      const auditLog = await this.prismaService.auditLog.create({
        data: {
          action,
          entity,
          entityId: entityId || null,
          userId: userId || null,
          oldValue: data?.oldValue || null,
          newValue: data?.newValue || null,
          ipAddress: data?.ipAddress || null,
          userAgent: data?.userAgent || null,
          description: data?.description || null,
          createdAt: new Date(),
        },
      });
      this.logger.debug(`Audit log: ${action} on ${entity}${entityId ? ` (${entityId})` : ''}`);
      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  async findAll(pagination: PaginationDto, filters?: any): Promise<any> {
    try {
      const where: any = {};
      if (filters?.userId) where.userId = filters.userId;
      if (filters?.action) where.action = filters.action;
      if (filters?.entity) where.entity = filters.entity;
      if (filters?.entityId) where.entityId = filters.entityId;
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const [logs, total] = await Promise.all([
        this.prismaService.auditLog.findMany({
          where,
          skip: pagination.getOffset(),
          take: pagination.getLimit(),
          orderBy: pagination.getOrderBy(),
          include: { user: { select: { id: true, email: true, name: true, role: true } } },
        }),
        this.prismaService.auditLog.count({ where }),
      ]);

      const pages = Math.ceil(total / pagination.getLimit());
      return { data: logs, total, page: pagination.page, limit: pagination.getLimit(), pages };
    } catch (error) {
      this.logger.error(`Failed to fetch audit logs: ${error.message}`);
      throw error;
    }
  }

  async findByEntity(entity: string, entityId: string): Promise<any[]> {
    try {
      const logs = await this.prismaService.auditLog.findMany({
        where: { entity, entityId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, name: true, role: true } } },
      });
      return logs;
    } catch (error) {
      this.logger.error(`Failed to fetch entity audit logs: ${error.message}`);
      throw error;
    }
  }

  async getUserActivity(userId: string, pagination: PaginationDto): Promise<any> {
    try {
      const user = await this.prismaService.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User ${userId} not found`);

      const [logs, total] = await Promise.all([
        this.prismaService.auditLog.findMany({
          where: { userId },
          skip: pagination.getOffset(),
          take: pagination.getLimit(),
          orderBy: pagination.getOrderBy(),
          include: { user: { select: { id: true, email: true, name: true, role: true } } },
        }),
        this.prismaService.auditLog.count({ where: { userId } }),
      ]);

      const pages = Math.ceil(total / pagination.getLimit());
      return { data: logs, total, page: pagination.page, limit: pagination.getLimit(), pages };
    } catch (error) {
      this.logger.error(`Failed to fetch user activity: ${error.message}`);
      throw error;
    }
  }

  async getRecentActivity(limit: number = 50): Promise<any[]> {
    try {
      const logs = await this.prismaService.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, name: true, role: true } } },
      });
      return logs;
    } catch (error) {
      this.logger.error(`Failed to fetch recent activity: ${error.message}`);
      throw error;
    }
  }

  async getActivityStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const totalActions = await this.prismaService.auditLog.count({ where });

      const actionBreakdown: Record<string, number> = {};
      const actionStats = await this.prismaService.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      });
      actionStats.forEach((item: any) => {
        actionBreakdown[item.action] = item._count;
      });

      const userBreakdown: Record<string, number> = {};
      const userStats = await this.prismaService.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
      });
      userStats.forEach((item: any) => {
        if (item.userId) userBreakdown[item.userId] = item._count;
      });

      const entityBreakdown: Record<string, number> = {};
      const entityStats = await this.prismaService.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: true,
      });
      entityStats.forEach((item: any) => {
        entityBreakdown[item.entity] = item._count;
      });

      return { totalActions, actionBreakdown, userBreakdown, entityBreakdown };
    } catch (error) {
      this.logger.error(`Failed to get activity stats: ${error.message}`);
      throw error;
    }
  }
}
