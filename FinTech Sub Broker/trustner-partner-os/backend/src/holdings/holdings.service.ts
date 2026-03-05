import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

/**
 * Holdings Service
 * Manages client investment holdings and portfolio valuation
 * Tracks NAV updates and returns calculation
 */
@Injectable()
export class HoldingsService {
  private readonly logger = new Logger('HoldingsService');

  constructor(private prismaService: PrismaService) {}

  /**
   * Get client's all holdings
   */
  async getClientHoldings(clientId: string, filters?: { category?: string }) {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const where: Prisma.HoldingWhereInput = { clientId };

    if (filters?.category) {
      where.scheme = { category: filters.category };
    }

    const holdings = await this.prismaService.holding.findMany({
      where,
      include: {
        scheme: {
          select: {
            schemeName: true,
            amcName: true,
            category: true,
            latestNav: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return holdings;
  }

  /**
   * Get detailed holding information
   */
  async getHoldingDetail(id: string) {
    const holding = await this.prismaService.holding.findUnique({
      where: { id },
      include: {
        scheme: {
          select: {
            schemeName: true,
            amcName: true,
            category: true,
            subCategory: true,
            latestNav: true,
            aum: true,
            expenseRatio: true,
          },
        },
        client: {
          select: {
            id: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!holding) {
      throw new NotFoundException(`Holding with ID ${id} not found`);
    }

    return holding;
  }

  /**
   * Update holding with new NAV data
   */
  async updateHolding(id: string, dto: UpdateHoldingDto) {
    const holding = await this.prismaService.holding.findUnique({
      where: { id },
    });

    if (!holding) {
      throw new NotFoundException(`Holding with ID ${id} not found`);
    }

    const updateData: Prisma.HoldingUpdateInput = {
      updatedAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    if (dto.currentNav) {
      updateData.currentNav = new Prisma.Decimal(dto.currentNav);
    }

    if (dto.currentValue) {
      updateData.currentValue = new Prisma.Decimal(dto.currentValue);
    }

    if (dto.avgNav) {
      updateData.avgNav = new Prisma.Decimal(dto.avgNav);
    }

    if (dto.absoluteReturn) {
      updateData.absoluteReturn = new Prisma.Decimal(dto.absoluteReturn);
    }

    if (dto.xirr) {
      updateData.xirr = new Prisma.Decimal(dto.xirr);
    }

    const updated = await this.prismaService.holding.update({
      where: { id },
      data: updateData,
      include: {
        scheme: { select: { schemeName: true } },
      },
    });

    this.logger.log(`Holding ${updated.id} updated for scheme ${updated.scheme.schemeName}`);

    return updated;
  }

  /**
   * Get portfolio summary for client
   */
  async getPortfolioSummary(clientId: string) {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
      include: {
        holdings: {
          include: {
            scheme: { select: { category: true } },
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const portfolio = {
      clientId,
      clientName: client.user?.name || 'N/A',
      totalHoldings: client.holdings.length,
      totalInvested: client.holdings.reduce(
        (sum, h) => sum + h.investedAmount.toNumber(),
        0,
      ),
      totalValue: client.holdings.reduce(
        (sum, h) => sum + h.currentValue.toNumber(),
        0,
      ),
      totalUnits: client.holdings.reduce((sum, h) => sum + h.units.toNumber(), 0),
      returns: 0 as number,
      returnPercentage: 0 as number,
      byCategory: {} as Record<string, any>,
      lastUpdated: new Date(),
    };

    // Calculate returns
    portfolio.returns = portfolio.totalValue - portfolio.totalInvested;
    portfolio.returnPercentage =
      portfolio.totalInvested > 0
        ? (portfolio.returns / portfolio.totalInvested) * 100
        : 0;

    // Group by category
    client.holdings.forEach((h) => {
      const category = h.scheme.category || 'Other';
      if (!portfolio.byCategory[category]) {
        portfolio.byCategory[category] = {
          invested: 0,
          value: 0,
          units: 0,
          count: 0,
        };
      }
      portfolio.byCategory[category].invested += h.investedAmount.toNumber();
      portfolio.byCategory[category].value += h.currentValue.toNumber();
      portfolio.byCategory[category].units += h.units.toNumber();
      portfolio.byCategory[category].count += 1;
    });

    return portfolio;
  }

  /**
   * Get sub-broker's total AUM
   */
  async getSubBrokerAUM(subBrokerId: string) {
    const clients = await this.prismaService.client.findMany({
      where: { subBrokerId },
      include: {
        holdings: {
          select: {
            currentValue: true,
            units: true,
            investedAmount: true,
          },
        },
      },
    });

    if (clients.length === 0) {
      return {
        subBrokerId,
        totalAUM: 0,
        totalInvested: 0,
        totalClients: 0,
        averagePortfolioValue: 0,
        totalHoldings: 0,
      };
    }

    const totalAUM = clients.reduce(
      (sum, client) =>
        sum +
        client.holdings.reduce((s, h) => s + h.currentValue.toNumber(), 0),
      0,
    );

    const totalInvested = clients.reduce(
      (sum, client) =>
        sum +
        client.holdings.reduce((s, h) => s + h.investedAmount.toNumber(), 0),
      0,
    );

    const totalHoldings = clients.reduce(
      (sum, client) => sum + client.holdings.length,
      0,
    );

    return {
      subBrokerId,
      totalAUM,
      totalInvested,
      totalClients: clients.length,
      averagePortfolioValue: clients.length > 0 ? totalAUM / clients.length : 0,
      totalHoldings,
    };
  }

  /**
   * Refresh NAV for a scheme
   */
  async refreshNav(schemeId: string, nav: string, navDate: Date) {
    const scheme = await this.prismaService.mutualFundScheme.findUnique({
      where: { id: schemeId },
    });

    if (!scheme) {
      throw new NotFoundException(`Scheme with ID ${schemeId} not found`);
    }

    // Check if NAV already exists for this date
    const existingNav = await this.prismaService.navHistory.findUnique({
      where: {
        schemeId_navDate: {
          schemeId,
          navDate,
        },
      },
    });

    if (existingNav) {
      throw new BadRequestException(
        `NAV already exists for this scheme on ${navDate.toISOString()}`,
      );
    }

    // Create NAV history entry
    const navEntry = await this.prismaService.navHistory.create({
      data: {
        schemeId,
        nav: new Prisma.Decimal(nav),
        navDate,
      },
    });

    // Update scheme's latest NAV
    const updatedScheme = await this.prismaService.mutualFundScheme.update({
      where: { id: schemeId },
      data: {
        latestNav: new Prisma.Decimal(nav),
        navDate,
        updatedAt: new Date(),
      },
    });

    // Update all holdings for this scheme
    const holdings = await this.prismaService.holding.findMany({
      where: { schemeId },
    });

    const newNavDecimal = new Prisma.Decimal(nav);

    for (const holding of holdings) {
      const currentValue = holding.units.times(newNavDecimal);

      await this.prismaService.holding.update({
        where: { id: holding.id },
        data: {
          currentNav: newNavDecimal,
          currentValue,
          lastUpdatedAt: new Date(),
        },
      });
    }

    this.logger.log(
      `NAV refreshed for scheme ${schemeId}: ${nav} (${holdings.length} holdings updated)`,
    );

    return {
      navEntry,
      holdingsUpdated: holdings.length,
    };
  }

  /**
   * Get scheme holders with pagination
   */
  async getSchemeHolders(schemeId: string, pagination: PaginationDto) {
    const scheme = await this.prismaService.mutualFundScheme.findUnique({
      where: { id: schemeId },
    });

    if (!scheme) {
      throw new NotFoundException(`Scheme with ID ${schemeId} not found`);
    }

    const [holdings, total] = await Promise.all([
      this.prismaService.holding.findMany({
        where: { schemeId },
        skip: pagination.getOffset(),
        take: pagination.getLimit(),
        orderBy: { currentValue: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              user: { select: { email: true } },
            },
          },
        },
      }),
      this.prismaService.holding.count({ where: { schemeId } }),
    ]);

    return {
      data: holdings,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
