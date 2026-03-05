import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AlertType, AlertSeverity } from '@prisma/client';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger('ComplianceService');

  constructor(private prismaService: PrismaService) {}

  async createAlert(createDto: CreateAlertDto): Promise<any> {
    try {
      if (createDto.subBrokerId) {
        const subBroker = await this.prismaService.subBroker.findUnique({
          where: { id: createDto.subBrokerId },
        });
        if (!subBroker) {
          throw new NotFoundException(`Sub-broker ${createDto.subBrokerId} not found`);
        }
      }

      if (createDto.clientId) {
        const client = await this.prismaService.client.findUnique({
          where: { id: createDto.clientId },
        });
        if (!client) {
          throw new NotFoundException(`Client ${createDto.clientId} not found`);
        }
      }

      const alert = await this.prismaService.complianceAlert.create({
        data: {
          subBrokerId: createDto.subBrokerId || null,
          clientId: createDto.clientId || null,
          type: createDto.type,
          severity: createDto.severity,
          title: createDto.title,
          description: createDto.description,
          dueDate: createDto.dueDate || null,
          isResolved: false,
        },
        include: { subBroker: true },
      });

      this.logger.log(`Compliance alert created: ${alert.id} (${alert.type})`);
      return alert;
    } catch (error) {
      this.logger.error(`Failed to create compliance alert: ${error.message}`);
      throw error;
    }
  }

  async findAll(pagination: PaginationDto, filters?: any): Promise<any> {
    try {
      const where: any = {};
      if (filters?.type) where.type = filters.type;
      if (filters?.severity) where.severity = filters.severity;
      if (filters?.isResolved !== undefined) where.isResolved = filters.isResolved;
      if (filters?.subBrokerId) where.subBrokerId = filters.subBrokerId;

      const [alerts, total] = await Promise.all([
        this.prismaService.complianceAlert.findMany({
          where,
          skip: pagination.getOffset(),
          take: pagination.getLimit(),
          orderBy: pagination.getOrderBy(),
          include: { subBroker: true },
        }),
        this.prismaService.complianceAlert.count({ where }),
      ]);

      const pages = Math.ceil(total / pagination.getLimit());
      return { data: alerts, total, page: pagination.page, limit: pagination.getLimit(), pages };
    } catch (error) {
      this.logger.error(`Failed to fetch compliance alerts: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<any> {
    const alert = await this.prismaService.complianceAlert.findUnique({
      where: { id },
      include: { subBroker: true },
    });
    if (!alert) throw new NotFoundException(`Compliance alert ${id} not found`);
    return alert;
  }

  async resolve(id: string, resolveDto: ResolveAlertDto, userId: string): Promise<any> {
    const alert = await this.prismaService.complianceAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException(`Compliance alert ${id} not found`);
    if (alert.isResolved) throw new BadRequestException('Alert is already resolved');

    const updated = await this.prismaService.complianceAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolution: resolveDto.resolution,
      },
      include: { subBroker: true },
    });

    this.logger.log(`Compliance alert resolved: ${id}`);
    return updated;
  }

  async getAlertsSummary(): Promise<any> {
    const [total, unresolved, critical, high, medium, low] = await Promise.all([
      this.prismaService.complianceAlert.count(),
      this.prismaService.complianceAlert.count({ where: { isResolved: false } }),
      this.prismaService.complianceAlert.count({ where: { severity: AlertSeverity.CRITICAL } }),
      this.prismaService.complianceAlert.count({ where: { severity: AlertSeverity.HIGH } }),
      this.prismaService.complianceAlert.count({ where: { severity: AlertSeverity.MEDIUM } }),
      this.prismaService.complianceAlert.count({ where: { severity: AlertSeverity.LOW } }),
    ]);

    const byType: Record<string, number> = {};
    const typeAlerts = await this.prismaService.complianceAlert.groupBy({
      by: ['type'],
      _count: true,
    });

    typeAlerts.forEach((item: any) => {
      byType[item.type] = item._count;
    });

    return { total, unresolved, critical, high, medium, low, byType };
  }

  async checkArnExpiry(): Promise<any> {
    this.logger.log('Running ARN expiry check...');
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const subBrokers = await this.prismaService.subBroker.findMany({
      where: {
        arnExpiryDate: { lte: ninetyDaysFromNow, gte: new Date() },
      },
    });

    let created = 0;
    for (const subBroker of subBrokers) {
      const existingAlert = await this.prismaService.complianceAlert.findFirst({
        where: { subBrokerId: subBroker.id, type: AlertType.ARN_EXPIRY, isResolved: false },
      });

      if (!existingAlert) {
        await this.createAlert({
          subBrokerId: subBroker.id,
          type: AlertType.ARN_EXPIRY,
          severity: AlertSeverity.HIGH,
          title: `ARN Certificate Expiring Soon - ${subBroker.arn}`,
          description: `ARN will expire on ${subBroker.arnExpiryDate?.toISOString()}`,
          dueDate: new Date(subBroker.arnExpiryDate || new Date()),
        });
        created++;
      }
    }
    this.logger.log(`ARN expiry check completed: ${created} new alerts`);
    return { created };
  }

  async checkNismExpiry(): Promise<any> {
    this.logger.log('Running NISM expiry check...');
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const subBrokers = await this.prismaService.subBroker.findMany({
      where: {
        nismExpiryDate: { lte: ninetyDaysFromNow, gte: new Date() },
      },
    });

    let created = 0;
    for (const subBroker of subBrokers) {
      const existingAlert = await this.prismaService.complianceAlert.findFirst({
        where: { subBrokerId: subBroker.id, type: AlertType.NISM_EXPIRY, isResolved: false },
      });

      if (!existingAlert) {
        await this.createAlert({
          subBrokerId: subBroker.id,
          type: AlertType.NISM_EXPIRY,
          severity: AlertSeverity.HIGH,
          title: `NISM Certificate Expiring Soon`,
          description: `NISM will expire on ${subBroker.nismExpiryDate?.toISOString()}`,
          dueDate: new Date(subBroker.nismExpiryDate || new Date()),
        });
        created++;
      }
    }
    this.logger.log(`NISM expiry check completed: ${created} new alerts`);
    return { created };
  }

  async checkIncompleteKyc(): Promise<any> {
    this.logger.log('Running incomplete KYC check...');
    const incompleteClients = await this.prismaService.client.findMany({
      where: { kycStatus: 'INCOMPLETE' },
    });

    let created = 0;
    for (const client of incompleteClients) {
      const existingAlert = await this.prismaService.complianceAlert.findFirst({
        where: { clientId: client.id, type: AlertType.KYC_INCOMPLETE, isResolved: false },
      });

      if (!existingAlert) {
        await this.createAlert({
          clientId: client.id,
          type: AlertType.KYC_INCOMPLETE,
          severity: AlertSeverity.MEDIUM,
          title: `KYC Incomplete - ${client.name}`,
          description: `KYC verification incomplete. Please complete to continue transactions.`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        created++;
      }
    }
    this.logger.log(`KYC check completed: ${created} new alerts`);
    return { created };
  }

  async runComplianceChecks(): Promise<any> {
    this.logger.log('Starting comprehensive compliance check...');
    const arnResult = await this.checkArnExpiry();
    const nismResult = await this.checkNismExpiry();
    const kycResult = await this.checkIncompleteKyc();

    const total = arnResult.created + nismResult.created + kycResult.created;
    this.logger.log(`Compliance check completed: ${total} total alerts`);
    return { arnExpiry: arnResult.created, nismExpiry: nismResult.created, kycIncomplete: kycResult.created, total };
  }

  async getSubBrokerAlerts(subBrokerId: string, pagination: PaginationDto): Promise<any> {
    const subBroker = await this.prismaService.subBroker.findUnique({ where: { id: subBrokerId } });
    if (!subBroker) throw new NotFoundException(`Sub-broker ${subBrokerId} not found`);

    const [alerts, total] = await Promise.all([
      this.prismaService.complianceAlert.findMany({
        where: { subBrokerId },
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: pagination.getOrderBy(),
        include: { subBroker: true },
      }),
      this.prismaService.complianceAlert.count({ where: { subBrokerId } }),
    ]);

    const pages = Math.ceil(total / pagination.getLimit());
    return { data: alerts, total, page: pagination.page, limit: pagination.getLimit(), pages };
  }
}
