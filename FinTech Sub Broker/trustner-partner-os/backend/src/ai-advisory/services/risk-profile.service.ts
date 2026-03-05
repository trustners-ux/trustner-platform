import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRiskProfileDto,
  RiskProfileResponse,
  RiskCategory,
  AgeBracket,
  IncomeLevel,
  InvestmentHorizon,
  ExistingInvestments,
  PortfolioDropReaction,
  PrimaryGoal,
  RecommendedAllocation,
} from '../dto/risk-profile.dto';

/**
 * Risk Profile Service
 * SEBI-aligned risk assessment questionnaire
 * Calculates risk category based on 10-question assessment
 * Score range: 0-50
 */
@Injectable()
export class RiskProfileService {
  private readonly logger = new Logger('RiskProfileService');

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate score for Q1: Age bracket
   * Younger age = higher score (more time to recover from losses)
   */
  private scoreAgeBracket(age: AgeBracket): number {
    const scores: Record<AgeBracket, number> = {
      [AgeBracket.BRACKET_18_25]: 5,
      [AgeBracket.BRACKET_26_35]: 4,
      [AgeBracket.BRACKET_36_45]: 3,
      [AgeBracket.BRACKET_46_55]: 2,
      [AgeBracket.BRACKET_55_PLUS]: 1,
    };
    return scores[age];
  }

  /**
   * Calculate score for Q2: Annual income
   * Higher income = higher score (better capacity to take risk)
   */
  private scoreIncomeLevel(income: IncomeLevel): number {
    const scores: Record<IncomeLevel, number> = {
      [IncomeLevel.LESS_THAN_5L]: 1,
      [IncomeLevel.BETWEEN_5_10L]: 2,
      [IncomeLevel.BETWEEN_10_25L]: 3,
      [IncomeLevel.BETWEEN_25_50L]: 4,
      [IncomeLevel.MORE_THAN_50L]: 5,
    };
    return scores[income];
  }

  /**
   * Calculate score for Q3: Investment horizon
   * Longer horizon = higher score (more time to recover)
   */
  private scoreInvestmentHorizon(horizon: InvestmentHorizon): number {
    const scores: Record<InvestmentHorizon, number> = {
      [InvestmentHorizon.LESS_THAN_1YR]: 1,
      [InvestmentHorizon.BETWEEN_1_3YR]: 2,
      [InvestmentHorizon.BETWEEN_3_5YR]: 3,
      [InvestmentHorizon.BETWEEN_5_10YR]: 4,
      [InvestmentHorizon.MORE_THAN_10YR]: 5,
    };
    return scores[horizon];
  }

  /**
   * Calculate score for Q4: Existing investments
   * More diversified portfolio = higher score (experience with volatility)
   */
  private scoreExistingInvestments(investments: ExistingInvestments): number {
    const scores: Record<ExistingInvestments, number> = {
      [ExistingInvestments.NONE]: 1,
      [ExistingInvestments.FD_ONLY]: 2,
      [ExistingInvestments.MF]: 3,
      [ExistingInvestments.STOCKS]: 4,
      [ExistingInvestments.DIVERSIFIED]: 5,
    };
    return scores[investments];
  }

  /**
   * Calculate score for Q5: Reaction to 20% portfolio drop
   * Willing to buy more = higher score (true risk appetite)
   */
  private scorePortfolioDropReaction(
    reaction: PortfolioDropReaction,
  ): number {
    const scores: Record<PortfolioDropReaction, number> = {
      [PortfolioDropReaction.SELL_ALL]: 1,
      [PortfolioDropReaction.SELL_SOME]: 2,
      [PortfolioDropReaction.HOLD]: 3,
      [PortfolioDropReaction.BUY_MORE]: 4,
      [PortfolioDropReaction.BUY_AGGRESSIVELY]: 5,
    };
    return scores[reaction];
  }

  /**
   * Calculate score for Q6: Primary goal
   * Aggressive growth goal = higher score
   */
  private scorePrimaryGoal(goal: PrimaryGoal): number {
    const scores: Record<PrimaryGoal, number> = {
      [PrimaryGoal.CAPITAL_SAFETY]: 1,
      [PrimaryGoal.REGULAR_INCOME]: 2,
      [PrimaryGoal.BALANCED_GROWTH]: 3,
      [PrimaryGoal.WEALTH_CREATION]: 4,
      [PrimaryGoal.AGGRESSIVE_GROWTH]: 5,
    };
    return scores[goal];
  }

  /**
   * Calculate score for Q7: Financial dependents
   * More dependents = lower score (less risk capacity)
   */
  private scoreDependents(dependents: number): number {
    if (dependents === 0) return 5;
    if (dependents === 1) return 4;
    if (dependents === 2) return 3;
    if (dependents === 3) return 2;
    return 1; // 4+ dependents
  }

  /**
   * Calculate score for Q8: Emergency fund
   * Better emergency fund = higher score (can take risk)
   */
  private scoreEmergencyFund(months: number): number {
    if (months === 0) return 1;
    if (months < 3) return 2;
    if (months < 6) return 3;
    if (months < 12) return 4;
    return 5;
  }

  /**
   * Calculate score for Q9: Loan/EMI percentage of income
   * Lower debt = higher score (better capacity for risk)
   */
  private scoreLoanEmiPercentage(percentage: number): number {
    if (percentage > 50) return 1;
    if (percentage > 30) return 2;
    if (percentage > 20) return 3;
    if (percentage > 10) return 4;
    return 5;
  }

  /**
   * Calculate score for Q10: Insurance coverage
   * Better coverage = higher score (protected against emergencies)
   */
  private scoreInsuranceCoverage(coverage: string): number {
    const normalizedCoverage = coverage.toLowerCase().trim();
    if (normalizedCoverage === 'none') return 1;
    if (
      normalizedCoverage === 'basic' ||
      normalizedCoverage === 'minimal'
    )
      return 2;
    if (normalizedCoverage === 'moderate' || normalizedCoverage === 'medium')
      return 3;
    if (normalizedCoverage === 'good' || normalizedCoverage === 'adequate')
      return 4;
    if (normalizedCoverage === 'comprehensive') return 5;
    return 3; // Default to moderate if unclear
  }

  /**
   * Determine risk category based on total score
   */
  private categorizeRisk(score: number): RiskCategory {
    if (score <= 18) return RiskCategory.CONSERVATIVE;
    if (score <= 26) return RiskCategory.MODERATELY_CONSERVATIVE;
    if (score <= 34) return RiskCategory.MODERATE;
    if (score <= 42) return RiskCategory.MODERATELY_AGGRESSIVE;
    return RiskCategory.AGGRESSIVE;
  }

  /**
   * Get recommended allocation based on risk category
   */
  private getRecommendedAllocation(
    category: RiskCategory,
  ): RecommendedAllocation {
    const allocations: Record<RiskCategory, RecommendedAllocation> = {
      [RiskCategory.CONSERVATIVE]: {
        equity: 30,
        debt: 60,
        gold: 5,
        international: 5,
      },
      [RiskCategory.MODERATELY_CONSERVATIVE]: {
        equity: 45,
        debt: 45,
        gold: 5,
        international: 5,
      },
      [RiskCategory.MODERATE]: {
        equity: 60,
        debt: 30,
        gold: 5,
        international: 5,
      },
      [RiskCategory.MODERATELY_AGGRESSIVE]: {
        equity: 70,
        debt: 20,
        gold: 5,
        international: 5,
      },
      [RiskCategory.AGGRESSIVE]: {
        equity: 80,
        debt: 10,
        gold: 5,
        international: 5,
      },
    };
    return allocations[category];
  }

  /**
   * Get description for risk category
   */
  private getCategoryDescription(category: RiskCategory): string {
    const descriptions: Record<RiskCategory, string> = {
      [RiskCategory.CONSERVATIVE]:
        'You are a conservative investor. Your primary focus is capital preservation with minimal volatility. Suitable for debt funds, liquid funds, and large-cap funds.',
      [RiskCategory.MODERATELY_CONSERVATIVE]:
        'You are a moderately conservative investor. You can tolerate limited volatility for stable growth. Suitable for balanced funds, debt funds, and large-cap funds.',
      [RiskCategory.MODERATE]:
        'You are a moderate investor. You balance growth with stability. Suitable for multi-cap funds, balanced advantage funds, and a mix of equity and debt.',
      [RiskCategory.MODERATELY_AGGRESSIVE]:
        'You are a moderately aggressive investor. You seek meaningful growth and can tolerate moderate volatility. Suitable for mid-cap, small-cap, and sectoral funds.',
      [RiskCategory.AGGRESSIVE]:
        'You are an aggressive investor. You have high risk capacity and seek maximum growth. Suitable for small-cap, sectoral, and thematic funds for long-term wealth creation.',
    };
    return descriptions[category];
  }

  /**
   * Create and store risk profile assessment
   */
  async createRiskProfile(dto: CreateRiskProfileDto): Promise<RiskProfileResponse> {
    try {
      // Calculate scores for all 10 questions
      const scores = {
        ageBracket: this.scoreAgeBracket(dto.ageBracket),
        incomeLevel: this.scoreIncomeLevel(dto.incomeLevel),
        investmentHorizon: this.scoreInvestmentHorizon(dto.investmentHorizon),
        existingInvestments: this.scoreExistingInvestments(
          dto.existingInvestments,
        ),
        portfolioDropReaction: this.scorePortfolioDropReaction(
          dto.portfolioDropReaction,
        ),
        primaryGoal: this.scorePrimaryGoal(dto.primaryGoal),
        dependents: this.scoreDependents(dto.financialDependents),
        emergencyFund: this.scoreEmergencyFund(dto.emergencyFundMonths),
        loanEmiPercentage: this.scoreLoanEmiPercentage(dto.loanEmiPercentage),
        insuranceCoverage: this.scoreInsuranceCoverage(
          dto.insuranceCoverage,
        ),
      };

      // Calculate total score (max 50)
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

      // Categorize risk
      const category = this.categorizeRisk(totalScore);

      // Get recommended allocation
      const recommendedAllocation = this.getRecommendedAllocation(category);

      // Get description
      const description = this.getCategoryDescription(category);

      this.logger.log(
        `Risk profile created for client ${dto.clientId}: Score=${totalScore}, Category=${category}`,
      );

      return {
        score: totalScore,
        category,
        description,
        recommendedAllocation,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error creating risk profile for client ${dto.clientId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get client's current risk profile
   */
  async getRiskProfile(clientId: string): Promise<RiskProfileResponse | null> {
    try {
      // Note: In a production system, you'd fetch this from database
      // For now, returning null if not found
      this.logger.log(`Fetching risk profile for client ${clientId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching risk profile for client ${clientId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update existing risk profile
   */
  async updateRiskProfile(
    clientId: string,
    dto: CreateRiskProfileDto,
  ): Promise<RiskProfileResponse> {
    try {
      this.logger.log(`Updating risk profile for client ${clientId}`);
      return await this.createRiskProfile(dto);
    } catch (error) {
      this.logger.error(
        `Error updating risk profile for client ${clientId}:`,
        error,
      );
      throw error;
    }
  }
}
