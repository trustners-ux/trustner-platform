import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';
import { SetTargetDto } from './dto/set-target.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger('SystemConfigService');
  private configCache: Map<string, any> = new Map();

  constructor(private prismaService: PrismaService) {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      const configs = await this.prismaService.systemConfig.findMany();
      configs.forEach((config) => {
        this.configCache.set(config.key, config);
      });
      this.logger.log(`Loaded ${configs.length} configurations into cache`);
    } catch (error) {
      this.logger.warn(`Failed to initialize cache: ${error.message}`);
    }
  }

  async getAll(category?: string): Promise<any[]> {
    const where = category ? { category } : {};
    return this.prismaService.systemConfig.findMany({ where, orderBy: { category: 'asc' } });
  }

  async get(key: string): Promise<any> {
    if (this.configCache.has(key)) return this.configCache.get(key);
    const config = await this.prismaService.systemConfig.findUnique({ where: { key } });
    if (!config) throw new NotFoundException(`Configuration ${key} not found`);
    this.configCache.set(key, config);
    return config;
  }

  async set(key: string, value: string, userId?: string): Promise<any> {
    const existing = await this.prismaService.systemConfig.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException(`Configuration ${key} not found`);
    if (!existing.isEditable) throw new BadRequestException(`Configuration ${key} is not editable`);

    const updated = await this.prismaService.systemConfig.update({
      where: { key },
      data: { value, updatedBy: userId || null, updatedAt: new Date() },
    });

    this.configCache.set(key, updated);
    this.logger.log(`Configuration updated: ${key}`);
    return updated;
  }

  async upsert(upsertDto: UpsertConfigDto, userId?: string): Promise<any> {
    const config = await this.prismaService.systemConfig.upsert({
      where: { key: upsertDto.key },
      update: {
        value: upsertDto.value,
        category: upsertDto.category || 'GENERAL',
        description: upsertDto.description || null,
        updatedBy: userId || null,
        updatedAt: new Date(),
      },
      create: {
        key: upsertDto.key,
        value: upsertDto.value,
        category: upsertDto.category || 'GENERAL',
        description: upsertDto.description || null,
        isEditable: true,
        updatedBy: userId || null,
      },
    });

    this.configCache.set(upsertDto.key, config);
    this.logger.log(`Configuration upserted: ${upsertDto.key}`);
    return config;
  }

  async delete(key: string): Promise<void> {
    const config = await this.prismaService.systemConfig.findUnique({ where: { key } });
    if (!config) throw new NotFoundException(`Configuration ${key} not found`);
    await this.prismaService.systemConfig.delete({ where: { key } });
    this.configCache.delete(key);
    this.logger.log(`Configuration deleted: ${key}`);
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.prismaService.systemConfig.findMany({
      distinct: ['category'],
      select: { category: true },
    });
    return categories.map((c) => c.category).sort();
  }

  async setPartnerTarget(setTargetDto: SetTargetDto): Promise<any> {
    const subBroker = await this.prismaService.subBroker.findUnique({
      where: { id: setTargetDto.subBrokerId },
    });
    if (!subBroker) throw new NotFoundException(`Sub-broker ${setTargetDto.subBrokerId} not found`);

    const target = await this.prismaService.partnerTarget.upsert({
      where: {
        subBrokerId_month_year: {
          subBrokerId: setTargetDto.subBrokerId,
          month: setTargetDto.month,
          year: setTargetDto.year,
        },
      },
      update: {
        aumTarget: new Decimal(setTargetDto.aumTarget),
        sipTarget: new Decimal(setTargetDto.sipTarget),
        clientTarget: setTargetDto.clientTarget,
        updatedAt: new Date(),
      },
      create: {
        subBrokerId: setTargetDto.subBrokerId,
        month: setTargetDto.month,
        year: setTargetDto.year,
        aumTarget: new Decimal(setTargetDto.aumTarget),
        sipTarget: new Decimal(setTargetDto.sipTarget),
        clientTarget: setTargetDto.clientTarget,
        aumAchieved: new Decimal(0),
        sipAchieved: new Decimal(0),
        clientAchieved: 0,
      },
      include: { subBroker: { select: { id: true, code: true, name: true } } },
    });

    this.logger.log(`Target set for ${setTargetDto.subBrokerId} (${setTargetDto.month}/${setTargetDto.year})`);
    return target;
  }

  async getPartnerTargets(subBrokerId: string, year?: number): Promise<any[]> {
    const subBroker = await this.prismaService.subBroker.findUnique({ where: { id: subBrokerId } });
    if (!subBroker) throw new NotFoundException(`Sub-broker ${subBrokerId} not found`);

    const where: any = { subBrokerId };
    if (year) where.year = year;

    return this.prismaService.partnerTarget.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { subBroker: { select: { id: true, code: true, name: true } } },
    });
  }

  async updateTargetAchievement(
    subBrokerId: string,
    month: number,
    year: number,
    field: 'aumAchieved' | 'sipAchieved' | 'clientAchieved',
    value: number | string,
  ): Promise<any> {
    const target = await this.prismaService.partnerTarget.findUnique({
      where: { subBrokerId_month_year: { subBrokerId, month, year } },
    });
    if (!target) throw new NotFoundException(`Target not found`);

    const updateData: any = {};
    if (field === 'clientAchieved') {
      updateData[field] = parseInt(value as string, 10);
    } else {
      updateData[field] = new Decimal(value as string);
    }
    updateData.updatedAt = new Date();

    const updated = await this.prismaService.partnerTarget.update({
      where: { subBrokerId_month_year: { subBrokerId, month, year } },
      data: updateData,
      include: { subBroker: { select: { id: true, code: true, name: true } } },
    });

    this.logger.log(`Target achievement updated: ${subBrokerId} (${field}=${value})`);
    return updated;
  }

  async getConfigValue(key: string): Promise<string | null> {
    try {
      const config = await this.get(key);
      return config?.value || null;
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }

  async getConfigNumber(key: string): Promise<number | null> {
    const value = await this.getConfigValue(key);
    return value ? parseInt(value, 10) : null;
  }

  async getConfigBoolean(key: string): Promise<boolean> {
    const value = await this.getConfigValue(key);
    return value === 'true' || value === '1' || value === 'yes';
  }
}
