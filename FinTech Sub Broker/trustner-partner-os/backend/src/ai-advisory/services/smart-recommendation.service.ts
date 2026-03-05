import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SmartRecommendationDto,
  SmartRecommendationResponse,
  MutualFundRecommendation,
  InsuranceRecommendation,
  FundCategory,
  InsuranceProductType,
  RecommendationUrgency,
  PortfolioHealthCheckAlerts,
} from '../dto/smart-recommend.dto';
import { RiskCategory } from '../dto/risk-profile.dto';

/**
 * Smart Recommendation Service
 * Provides rule-based MF + Insurance recommendations
 * Checks portfolio health and suggests optimizations
 */
@Injectable()
export class SmartRecommendationService {
  private readonly logger = new Logger('SmartRecommendationService');

  constructor(private prisma: PrismaService) {}

  /**
   * Get mutual fund category recommendations based on risk profile
   */
  private getMFRecommendations(
    riskProfile: RiskCategory,
    yearsInvested: number = 0,
    existingPortfolioValue: number = 0,
  ): MutualFundRecommendation[] {
    const recommendations: MutualFundRecommendation[] = [];

    // New investors start with index funds
    if (yearsInvested === 0 || existingPortfolioValue === 0) {
      recommendations.push({
        category: FundCategory.INDEX_FUND,
        allocationPercentage: 40,
        rationale: 'Low-cost diversified exposure for new investors',
        explanation:
          'Index funds provide market-linked returns with minimal expense ratios, perfect for starting your investment journey',
        expectedReturnRange: '10-12%',
        recommendedSIPAmount: 5000,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.LARGE_CAP,
        allocationPercentage: 35,
        rationale: 'Stable growth from established companies',
        explanation:
          'Large-cap funds invest in mature companies with proven track records and strong fundamentals',
        expectedReturnRange: '9-11%',
        recommendedSIPAmount: 4000,
        riskLevel: RiskCategory.MODERATELY_CONSERVATIVE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.BALANCED,
        allocationPercentage: 25,
        rationale: 'Mix of equity and debt for balanced growth',
        explanation:
          'Balanced funds reduce volatility while maintaining growth potential through equity-debt diversification',
        expectedReturnRange: '8-10%',
        recommendedSIPAmount: 3000,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '3+ years',
      });

      return recommendations;
    }

    // Conservative profile
    if (riskProfile === RiskCategory.CONSERVATIVE) {
      recommendations.push({
        category: FundCategory.LARGE_CAP,
        allocationPercentage: 40,
        rationale: 'Stable companies with lower volatility',
        explanation: 'Large-cap funds are suitable for conservative investors',
        expectedReturnRange: '9-11%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.BALANCED,
        allocationPercentage: 35,
        rationale: 'Balanced growth with lower equity exposure',
        explanation: 'Provides stability with moderate growth potential',
        expectedReturnRange: '8-10%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '3+ years',
      });

      recommendations.push({
        category: FundCategory.DEBT,
        allocationPercentage: 20,
        rationale: 'Regular income generation',
        explanation: 'Debt funds provide steady returns with lower risk',
        expectedReturnRange: '6-7%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '1-3 years',
      });

      recommendations.push({
        category: FundCategory.GOLD,
        allocationPercentage: 5,
        rationale: 'Inflation hedge and diversification',
        explanation: 'Gold provides portfolio protection during market downturns',
        expectedReturnRange: '5-8%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '5+ years',
      });
    }
    // Moderately Conservative
    else if (riskProfile === RiskCategory.MODERATELY_CONSERVATIVE) {
      recommendations.push({
        category: FundCategory.LARGE_CAP,
        allocationPercentage: 35,
        rationale: 'Foundation of stable investment portfolio',
        explanation: 'Large-cap funds provide consistent growth',
        expectedReturnRange: '9-11%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATELY_CONSERVATIVE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.MULTI_CAP,
        allocationPercentage: 20,
        rationale: 'Diversification across market cap sizes',
        explanation: 'Multi-cap funds balance growth with stability',
        expectedReturnRange: '11-13%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.BALANCED_ADVANTAGE,
        allocationPercentage: 25,
        rationale: 'Dynamic allocation to market cycles',
        explanation:
          'Automatically adjusts equity-debt mix based on market conditions',
        expectedReturnRange: '10-12%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '3+ years',
      });

      recommendations.push({
        category: FundCategory.DEBT,
        allocationPercentage: 15,
        rationale: 'Stability and regular income',
        explanation: 'Reduces overall portfolio volatility',
        expectedReturnRange: '6-8%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '1-3 years',
      });

      recommendations.push({
        category: FundCategory.GOLD,
        allocationPercentage: 5,
        rationale: 'Hedge against inflation',
        explanation: 'Provides portfolio diversification',
        expectedReturnRange: '5-8%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '5+ years',
      });
    }
    // Moderate
    else if (riskProfile === RiskCategory.MODERATE) {
      recommendations.push({
        category: FundCategory.MULTI_CAP,
        allocationPercentage: 35,
        rationale: 'Diversified growth across all market caps',
        explanation: 'Multi-cap funds capture opportunities across market',
        expectedReturnRange: '11-13%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.LARGE_CAP,
        allocationPercentage: 20,
        rationale: 'Foundation with stability',
        explanation: 'Large-cap exposure provides stability',
        expectedReturnRange: '9-11%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATELY_CONSERVATIVE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.MID_CAP,
        allocationPercentage: 15,
        rationale: 'Growth potential with higher returns',
        explanation: 'Mid-cap funds offer balanced growth opportunities',
        expectedReturnRange: '12-14%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATELY_AGGRESSIVE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.BALANCED,
        allocationPercentage: 20,
        rationale: 'Reduced volatility',
        explanation: 'Balanced funds smooth market volatility',
        expectedReturnRange: '10-12%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '3+ years',
      });

      recommendations.push({
        category: FundCategory.INTERNATIONAL,
        allocationPercentage: 5,
        rationale: 'Global diversification',
        explanation: 'International exposure reduces domestic market risk',
        expectedReturnRange: '10-12%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.GOLD,
        allocationPercentage: 5,
        rationale: 'Portfolio diversification',
        explanation: 'Adds non-correlated asset class',
        expectedReturnRange: '5-8%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '5+ years',
      });
    }
    // Moderately Aggressive
    else if (riskProfile === RiskCategory.MODERATELY_AGGRESSIVE) {
      recommendations.push({
        category: FundCategory.MULTI_CAP,
        allocationPercentage: 30,
        rationale: 'Core growth portfolio',
        explanation: 'Provides diversified equity exposure with growth focus',
        expectedReturnRange: '11-13%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.MID_CAP,
        allocationPercentage: 25,
        rationale: 'Higher growth potential',
        explanation: 'Mid-cap stocks have strong growth prospects',
        expectedReturnRange: '12-14%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATELY_AGGRESSIVE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.SMALL_CAP,
        allocationPercentage: 15,
        rationale: 'Maximum growth potential',
        explanation: 'Small-cap funds offer highest growth but with volatility',
        expectedReturnRange: '14-16%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.AGGRESSIVE,
        timeHorizon: '10+ years',
      });

      recommendations.push({
        category: FundCategory.SECTORAL,
        allocationPercentage: 10,
        rationale: 'Concentrated growth in high-potential sectors',
        explanation:
          'Sectoral funds capture growth in specific industries',
        expectedReturnRange: '13-15%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.AGGRESSIVE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.BALANCED,
        allocationPercentage: 12,
        rationale: 'Risk mitigation',
        explanation: 'Provides cushion against equity downturns',
        expectedReturnRange: '10-12%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '3+ years',
      });

      recommendations.push({
        category: FundCategory.INTERNATIONAL,
        allocationPercentage: 5,
        rationale: 'Global growth exposure',
        explanation: 'Diversification beyond domestic markets',
        expectedReturnRange: '10-12%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.GOLD,
        allocationPercentage: 3,
        rationale: 'Minimal diversification',
        explanation: 'Small hedge against market downturns',
        expectedReturnRange: '5-8%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '5+ years',
      });
    }
    // Aggressive
    else {
      recommendations.push({
        category: FundCategory.SMALL_CAP,
        allocationPercentage: 30,
        rationale: 'Maximum wealth creation potential',
        explanation:
          'Small-cap funds are for long-term wealth creation despite high volatility',
        expectedReturnRange: '14-16%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.AGGRESSIVE,
        timeHorizon: '10+ years',
      });

      recommendations.push({
        category: FundCategory.MID_CAP,
        allocationPercentage: 25,
        rationale: 'Strong growth with managed risk',
        explanation: 'Mid-cap funds balance growth and stability',
        expectedReturnRange: '12-14%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATELY_AGGRESSIVE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.MULTI_CAP,
        allocationPercentage: 20,
        rationale: 'Diversified growth exposure',
        explanation: 'Captures opportunities across all market capitalizations',
        expectedReturnRange: '11-13%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '5+ years',
      });

      recommendations.push({
        category: FundCategory.SECTORAL,
        allocationPercentage: 15,
        rationale: 'Concentrated bets on high-growth sectors',
        explanation: 'Sectoral funds capture industry-specific growth',
        expectedReturnRange: '13-15%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.AGGRESSIVE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.INTERNATIONAL,
        allocationPercentage: 8,
        rationale: 'Global market exposure',
        explanation: 'Diversification across international markets',
        expectedReturnRange: '10-12%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.MODERATE,
        timeHorizon: '7+ years',
      });

      recommendations.push({
        category: FundCategory.GOLD,
        allocationPercentage: 2,
        rationale: 'Minimal portfolio diversification',
        explanation: 'Small allocation for hedging purposes',
        expectedReturnRange: '5-8%',
        recommendedSIPAmount: undefined,
        riskLevel: RiskCategory.CONSERVATIVE,
        timeHorizon: '5+ years',
      });
    }

    return recommendations;
  }

  /**
   * Get insurance recommendations based on profile
   */
  private getInsuranceRecommendations(
    hasLifeInsurance: boolean,
    hasHealthInsurance: boolean,
    dependents: number = 0,
    annualIncome: number = 0,
    emergencyFundMonths: number = 0,
  ): InsuranceRecommendation[] {
    const recommendations: InsuranceRecommendation[] = [];

    // Priority 1: Term Life Insurance
    if (!hasLifeInsurance) {
      recommendations.push({
        productType: InsuranceProductType.TERM_LIFE,
        recommendedCover: Math.max(1000000, annualIncome * 10),
        rationale: 'Critical gap: No life insurance coverage identified',
        urgency: RecommendationUrgency.IMMEDIATE,
        estimatedPremium: Math.round((annualIncome * 10 * 0.003) / 12) * 12,
        explanation:
          'Term life insurance is the foundation of financial security',
        suggestedAction:
          'Apply for 20-year term life insurance with coverage of at least 10x annual income',
      });
    } else if (dependents > 0) {
      recommendations.push({
        productType: InsuranceProductType.TERM_LIFE,
        recommendedCover: annualIncome * 12,
        rationale: 'Review and increase coverage if dependents increased',
        urgency: RecommendationUrgency.MEDIUM,
        estimatedPremium: Math.round((annualIncome * 12 * 0.003) / 12) * 12,
        explanation: 'Dependents increase your life insurance needs',
        suggestedAction: 'Consider increasing term life cover to 12x annual income',
      });
    }

    // Priority 2: Health Insurance
    if (!hasHealthInsurance) {
      const healthCover = 500000; // Base ₹5L
      recommendations.push({
        productType: InsuranceProductType.FAMILY_HEALTH_FLOATER,
        recommendedCover: healthCover,
        rationale: 'No health insurance coverage found',
        urgency: RecommendationUrgency.HIGH,
        estimatedPremium: Math.round((healthCover * 0.007) / 12) * 12,
        explanation:
          'Health insurance protects against medical emergencies and rising healthcare costs',
        suggestedAction:
          'Get a family health floater of at least ₹5 lakhs with cashless facilities',
      });
    } else {
      recommendations.push({
        productType: InsuranceProductType.FAMILY_HEALTH_FLOATER,
        recommendedCover: Math.max(1000000, (dependents + 1) * 500000),
        rationale: 'Review family floater adequacy',
        urgency: RecommendationUrgency.MEDIUM,
        estimatedPremium: Math.round((1000000 * 0.007) / 12) * 12,
        explanation:
          'Ensure health cover is adequate for family size',
        suggestedAction:
          'Review and enhance family health floater to ensure adequate coverage',
      });
    }

    // Priority 3: Critical Illness (for higher income)
    if (annualIncome > 1000000) {
      recommendations.push({
        productType: InsuranceProductType.CRITICAL_ILLNESS,
        recommendedCover: annualIncome * 0.5,
        rationale: 'High earner - protection against income loss from illness',
        urgency: RecommendationUrgency.HIGH,
        estimatedPremium: Math.round((annualIncome * 0.5 * 0.004) / 12) * 12,
        explanation:
          'Critical illness cover protects your income-earning capacity',
        suggestedAction:
          'Get critical illness cover for 50% of annual income with 90-day waiting period',
      });
    }

    return recommendations;
  }

  /**
   * Check portfolio health and identify alerts
   */
  private checkPortfolioHealth(
    existingPortfolioValue: number,
  ): PortfolioHealthCheckAlerts[] {
    const alerts: PortfolioHealthCheckAlerts[] = [];

    if (!existingPortfolioValue || existingPortfolioValue === 0) {
      alerts.push({
        alertType: 'NO_EXISTING_PORTFOLIO',
        message: 'You do not have any existing portfolio yet. Start investing today!',
        severity: RecommendationUrgency.MEDIUM,
        suggestedAction:
          'Start with a monthly SIP of at least ₹5,000 in recommended funds',
      });
    } else if (existingPortfolioValue < 100000) {
      alerts.push({
        alertType: 'SMALL_PORTFOLIO',
        message:
          'Your portfolio is small. Increase monthly contributions to accelerate growth.',
        severity: RecommendationUrgency.LOW,
        suggestedAction: 'Increase SIP amount to 20% of monthly surplus income',
      });
    }

    return alerts;
  }

  /**
   * Calculate portfolio health score
   */
  private calculatePortfolioHealthScore(
    hasLifeInsurance: boolean,
    hasHealthInsurance: boolean,
    emergencyFundMonths: number,
    existingPortfolioValue: number,
    monthlySurplus: number,
  ): number {
    let score = 40; // Base score

    // Insurance coverage
    if (hasLifeInsurance) score += 20;
    if (hasHealthInsurance) score += 15;

    // Emergency fund
    if (emergencyFundMonths >= 12) score += 15;
    else if (emergencyFundMonths >= 6) score += 10;
    else if (emergencyFundMonths >= 3) score += 5;

    // Active investing
    if (existingPortfolioValue > 500000) score += 10;
    else if (existingPortfolioValue > 100000) score += 5;

    // Regular contributions
    if (monthlySurplus && monthlySurplus > 5000) score += 5;

    return Math.min(100, score);
  }

  /**
   * Generate smart recommendations for a client
   */
  async generateRecommendations(
    dto: SmartRecommendationDto,
  ): Promise<SmartRecommendationResponse> {
    try {
      // Get MF recommendations
      const mfRecommendations = this.getMFRecommendations(
        dto.riskProfile,
        dto.yearsInvestedInMF || 0,
        dto.existingPortfolioValue || 0,
      );

      // Get insurance recommendations
      const insuranceRecommendations = this.getInsuranceRecommendations(
        dto.hasLifeInsurance || false,
        dto.hasHealthInsurance || false,
        dto.dependents || 0,
        dto.annualIncome,
        dto.emergencyFundMonths || 0,
      );

      // Calculate recommended monthly SIP (20% of monthly surplus)
      const recommendedMonthlySIP = Math.round(
        (dto.monthlySurplus || 25000) * 0.2,
      );

      // Check portfolio health
      const portfolioAlerts = this.checkPortfolioHealth(
        dto.existingPortfolioValue || 0,
      );

      // Calculate portfolio health score
      const portfolioHealthScore = this.calculatePortfolioHealthScore(
        dto.hasLifeInsurance || false,
        dto.hasHealthInsurance || false,
        dto.emergencyFundMonths || 0,
        dto.existingPortfolioValue || 0,
        dto.monthlySurplus || 0,
      );

      // Create action items
      const actionItems: Array<{
        priority: number;
        action: string;
        timeframe: string;
      }> = [];

      // Priority insurance actions
      insuranceRecommendations.forEach((rec, idx) => {
        if (
          rec.urgency === RecommendationUrgency.IMMEDIATE ||
          rec.urgency === RecommendationUrgency.HIGH
        ) {
          actionItems.push({
            priority: actionItems.length + 1,
            action: rec.suggestedAction,
            timeframe:
              rec.urgency === RecommendationUrgency.IMMEDIATE
                ? '1-2 weeks'
                : '1 month',
          });
        }
      });

      // Investment setup action
      actionItems.push({
        priority: actionItems.length + 1,
        action: `Start/Increase SIP to ₹${recommendedMonthlySIP.toLocaleString('en-IN')} per month`,
        timeframe: 'Immediately',
      });

      // Portfolio review action
      actionItems.push({
        priority: actionItems.length + 1,
        action: 'Review portfolio allocation in 6 months',
        timeframe: '6 months',
      });

      // Next review date (3 months from now)
      const nextReviewDate = new Date();
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 3);

      const response: SmartRecommendationResponse = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientId: dto.clientId,
        portfolioHealthScore,
        mfRecommendations,
        insuranceRecommendations,
        recommendedMonthlySIP,
        sipStepUpPercentage: 10,
        portfolioAlerts,
        rebalancingAdvice: undefined,
        diversificationAnalysis:
          'Recommended allocation covers major asset classes for balanced diversification',
        actionItems,
        nextReviewDate: nextReviewDate.toISOString().split('T')[0],
        createdAt: new Date(),
      };

      this.logger.log(
        `Smart recommendations generated for client ${dto.clientId}: HealthScore=${portfolioHealthScore}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error generating recommendations for client ${dto.clientId}:`,
        error,
      );
      throw error;
    }
  }
}
