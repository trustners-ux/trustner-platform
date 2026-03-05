import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateGoalPlanDto,
  GoalPlanResponse,
  GoalType,
  GoalAllocation,
  Milestone,
} from '../dto/goal-plan.dto';
import { RiskCategory } from '../dto/risk-profile.dto';

/**
 * Goal Planner Service
 * Calculates SIP requirements and tracks progress towards financial goals
 * Uses compound interest and SIP formulas for projections
 */
@Injectable()
export class GoalPlannerService {
  private readonly logger = new Logger('GoalPlannerService');

  constructor(private prisma: PrismaService) {}

  /**
   * Get expected annual return based on risk profile
   * Conservative: 8%, Moderate: 12%, Aggressive: 15%
   */
  private getExpectedReturn(riskProfile: RiskCategory): number {
    const returns: Record<RiskCategory, number> = {
      CONSERVATIVE: 8,
      MODERATELY_CONSERVATIVE: 9,
      MODERATE: 12,
      MODERATELY_AGGRESSIVE: 13,
      AGGRESSIVE: 15,
    };
    return returns[riskProfile] || 12;
  }

  /**
   * Calculate required monthly SIP to achieve target goal
   * Using FV = P × [((1+r)^n - 1) / r] × (1+r)
   * Where r = monthly rate, n = number of months, P = monthly payment
   *
   * Rearranged to solve for P (SIP amount):
   * P = FV / [((1+r)^n - 1) / r] × (1+r)
   *
   * Also accounts for existing savings growth
   */
  private calculateRequiredSIP(
    targetAmount: number,
    currentSavings: number,
    monthlyContribution: number,
    timelineYears: number,
    annualReturnRate: number,
  ): number {
    const months = timelineYears * 12;
    const monthlyRate = annualReturnRate / 100 / 12;

    // Growth of current savings (compound interest)
    const futureValueOfCurrentSavings =
      currentSavings * Math.pow(1 + monthlyRate, months);

    // If current savings already exceed target
    if (futureValueOfCurrentSavings >= targetAmount) {
      return 0;
    }

    // Remaining amount to accumulate via SIP
    const remainingAmount = targetAmount - futureValueOfCurrentSavings;

    // SIP future value formula: FV = P × [((1+r)^n - 1) / r] × (1+r)
    const numerator = Math.pow(1 + monthlyRate, months) - 1;
    const sipFutureValueFactor = (numerator / monthlyRate) * (1 + monthlyRate);

    // Calculate required SIP
    const requiredSIP = remainingAmount / sipFutureValueFactor;

    // Return the maximum of required SIP or existing contribution
    return Math.max(requiredSIP, monthlyContribution);
  }

  /**
   * Calculate projected final amount after goal timeline
   */
  private calculateProjectedAmount(
    currentSavings: number,
    monthlySIP: number,
    timelineYears: number,
    annualReturnRate: number,
  ): number {
    const months = timelineYears * 12;
    const monthlyRate = annualReturnRate / 100 / 12;

    // Future value of current savings
    const fvCurrentSavings =
      currentSavings * Math.pow(1 + monthlyRate, months);

    // Future value of SIP
    const numerator = Math.pow(1 + monthlyRate, months) - 1;
    const sipFV =
      monthlySIP * (numerator / monthlyRate) * (1 + monthlyRate);

    return fvCurrentSavings + sipFV;
  }

  /**
   * Get recommended allocation based on goal type and timeline
   */
  private getGoalAllocation(
    goalType: GoalType,
    timelineYears: number,
  ): GoalAllocation {
    // Rule-based allocations
    if (timelineYears < 1) {
      // Emergency fund - capital preservation
      return {
        equity: 0,
        debt: 80,
        gold: 10,
        international: 10,
      };
    }

    if (goalType === GoalType.EMERGENCY_FUND) {
      return {
        equity: 0,
        debt: 100,
        gold: 0,
        international: 0,
      };
    }

    if (goalType === GoalType.RETIREMENT && timelineYears >= 10) {
      return {
        equity: 70,
        debt: 20,
        gold: 5,
        international: 5,
      };
    }

    if (goalType === GoalType.RETIREMENT && timelineYears < 10) {
      return {
        equity: 50,
        debt: 40,
        gold: 5,
        international: 5,
      };
    }

    if (goalType === GoalType.CHILD_EDUCATION) {
      if (timelineYears > 10)
        return {
          equity: 60,
          debt: 30,
          gold: 5,
          international: 5,
        };
      if (timelineYears > 5)
        return {
          equity: 40,
          debt: 50,
          gold: 5,
          international: 5,
        };
      return {
        equity: 20,
        debt: 70,
        gold: 5,
        international: 5,
      };
    }

    if (goalType === GoalType.HOUSE_PURCHASE) {
      if (timelineYears > 5)
        return {
          equity: 50,
          debt: 40,
          gold: 5,
          international: 5,
        };
      return {
        equity: 30,
        debt: 60,
        gold: 5,
        international: 5,
      };
    }

    if (
      goalType === GoalType.WEALTH_CREATION ||
      goalType === GoalType.MARRIAGE ||
      goalType === GoalType.CAR_PURCHASE
    ) {
      if (timelineYears > 5)
        return {
          equity: 65,
          debt: 25,
          gold: 5,
          international: 5,
        };
      return {
        equity: 45,
        debt: 45,
        gold: 5,
        international: 5,
      };
    }

    // Default allocation
    return {
      equity: 60,
      debt: 30,
      gold: 5,
      international: 5,
    };
  }

  /**
   * Create milestones for goal tracking
   */
  private createMilestones(
    targetAmount: number,
    timelineYears: number,
    annualReturnRate: number,
  ): Milestone[] {
    const milestones: Milestone[] = [];
    const now = new Date();

    // 25% milestone
    milestones.push({
      percentage: 25,
      amount: targetAmount * 0.25,
      targetDate: new Date(now.getTime() + (timelineYears * 0.25 * 365.25 * 24 * 60 * 60 * 1000))
        .toISOString()
        .split('T')[0],
    });

    // 50% milestone
    milestones.push({
      percentage: 50,
      amount: targetAmount * 0.5,
      targetDate: new Date(now.getTime() + (timelineYears * 0.5 * 365.25 * 24 * 60 * 60 * 1000))
        .toISOString()
        .split('T')[0],
    });

    // 75% milestone
    milestones.push({
      percentage: 75,
      amount: targetAmount * 0.75,
      targetDate: new Date(now.getTime() + (timelineYears * 0.75 * 365.25 * 24 * 60 * 60 * 1000))
        .toISOString()
        .split('T')[0],
    });

    // 100% milestone
    milestones.push({
      percentage: 100,
      amount: targetAmount,
      targetDate: new Date(now.getTime() + (timelineYears * 365.25 * 24 * 60 * 60 * 1000))
        .toISOString()
        .split('T')[0],
    });

    return milestones;
  }

  /**
   * Get goal name
   */
  private getGoalName(goalType: GoalType, customName?: string): string {
    const goalNames: Record<GoalType, string> = {
      [GoalType.RETIREMENT]: 'Retirement Planning',
      [GoalType.CHILD_EDUCATION]: "Child's Education",
      [GoalType.HOUSE_PURCHASE]: 'House Purchase',
      [GoalType.WEALTH_CREATION]: 'Wealth Creation',
      [GoalType.EMERGENCY_FUND]: 'Emergency Fund',
      [GoalType.MARRIAGE]: 'Marriage',
      [GoalType.CAR_PURCHASE]: 'Car Purchase',
      [GoalType.VACATION]: 'Vacation',
      [GoalType.CUSTOM]: customName || 'Custom Goal',
    };
    return goalNames[goalType];
  }

  /**
   * Create investment plan for a goal
   */
  async createGoalPlan(dto: CreateGoalPlanDto): Promise<GoalPlanResponse> {
    try {
      const expectedReturn = this.getExpectedReturn(dto.riskProfile);
      const inflationRate = dto.inflationRate || 5;
      const inflationAdjustedTarget = dto.targetAmount * Math.pow(1 + inflationRate / 100, dto.timelineYears);

      // Calculate required monthly SIP
      const requiredMonthlySIP = this.calculateRequiredSIP(
        inflationAdjustedTarget,
        dto.currentSavings,
        dto.monthlyContribution,
        dto.timelineYears,
        expectedReturn,
      );

      // Calculate projected final amount
      const projectedFinalAmount = this.calculateProjectedAmount(
        dto.currentSavings,
        requiredMonthlySIP,
        dto.timelineYears,
        expectedReturn,
      );

      // Calculate surplus/shortfall
      const surplusShortfall = projectedFinalAmount - inflationAdjustedTarget;

      // Get recommended allocation
      const recommendedAllocation = this.getGoalAllocation(
        dto.goalType,
        dto.timelineYears,
      );

      // Create milestones
      const milestones = this.createMilestones(
        inflationAdjustedTarget,
        dto.timelineYears,
        expectedReturn,
      );

      // Calculate progress (current savings as % of target)
      const progressPercentage = Math.min(
        100,
        (dto.currentSavings / inflationAdjustedTarget) * 100,
      );

      // Target date
      const targetDate = new Date();
      targetDate.setFullYear(targetDate.getFullYear() + dto.timelineYears);

      const response: GoalPlanResponse = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientId: dto.clientId,
        goalType: dto.goalType,
        goalName: this.getGoalName(dto.goalType, dto.customGoalName),
        targetAmount: inflationAdjustedTarget,
        timelineYears: dto.timelineYears,
        targetDate: targetDate.toISOString().split('T')[0],
        currentSavings: dto.currentSavings,
        requiredMonthlySIP: Math.round(requiredMonthlySIP),
        expectedReturnPercentage: expectedReturn,
        projectedFinalAmount: Math.round(projectedFinalAmount),
        surplusShortfall: Math.round(surplusShortfall),
        riskProfile: dto.riskProfile,
        recommendedAllocation,
        milestones,
        progressPercentage: Math.round(progressPercentage),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(
        `Goal plan created for client ${dto.clientId}: ${response.goalName}, RequiredSIP=${response.requiredMonthlySIP}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error creating goal plan for client ${dto.clientId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all goal plans for a client
   */
  async getClientGoalPlans(clientId: string): Promise<GoalPlanResponse[]> {
    try {
      this.logger.log(`Fetching goal plans for client ${clientId}`);
      // In production, fetch from database
      return [];
    } catch (error) {
      this.logger.error(
        `Error fetching goal plans for client ${clientId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update goal plan
   */
  async updateGoalPlan(
    goalId: string,
    dto: CreateGoalPlanDto,
  ): Promise<GoalPlanResponse> {
    try {
      this.logger.log(`Updating goal plan ${goalId}`);
      return await this.createGoalPlan(dto);
    } catch (error) {
      this.logger.error(`Error updating goal plan ${goalId}:`, error);
      throw error;
    }
  }
}
