import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  InsuranceGapAnalysisDto,
  InsuranceGapAnalysisResponse,
  LifeInsuranceGap,
  HealthInsuranceGap,
  MotorInsuranceStatus,
  CriticalIllnessGap,
  ActionItem,
  InsurancePriority,
} from '../dto/insurance-gap.dto';

/**
 * Insurance Gap Analysis Service
 * Identifies insurance coverage gaps and provides recommendations
 * Rule-based insurance adequacy assessment
 */
@Injectable()
export class InsuranceGapService {
  private readonly logger = new Logger('InsuranceGapService');

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate life insurance gap
   * Rule: 10x annual income + total loans - existing cover
   * Adjustments: +20% if dependents > 2, +10% per young child
   */
  private calculateLifeInsuranceGap(
    annualIncome: number,
    existingCover: number,
    totalLoans: number = 0,
    dependents: number = 0,
  ): LifeInsuranceGap {
    // Base calculation: 10x annual income + total loans
    let idealCover = annualIncome * 10 + totalLoans;

    // Adjustment for dependents
    if (dependents > 2) {
      idealCover = idealCover * 1.2; // 20% increase
    }

    // Calculate gap
    const gap = Math.max(0, idealCover - existingCover);

    // Estimate premium (roughly 0.25-0.3% of cover per annum for term insurance)
    const estimatedPremium = Math.round((gap * 0.003) / 12) * 12; // Round to nearest 1000

    // Determine priority
    let priority: InsurancePriority;
    if (gap > annualIncome * 5) {
      priority = InsurancePriority.CRITICAL;
    } else if (gap > annualIncome * 2) {
      priority = InsurancePriority.HIGH;
    } else if (gap > annualIncome * 0.5) {
      priority = InsurancePriority.MEDIUM;
    } else if (gap > 0) {
      priority = InsurancePriority.LOW;
    } else {
      priority = InsurancePriority.ADEQUATE;
    }

    const recommendation =
      gap === 0
        ? 'Life insurance coverage is adequate'
        : `You need additional ₹${(gap / 100000).toFixed(1)} lakhs term life cover`;

    return {
      idealCover: Math.round(idealCover),
      existingCover,
      gap: Math.round(gap),
      recommendation,
      estimatedPremium,
      priority,
    };
  }

  /**
   * Calculate health insurance gap
   * Rule: Base ₹5L + ₹2L per family member + ₹5L for metro + ₹2L per young child
   * Recommend super top-up if existing < ₹10L
   */
  private calculateHealthInsuranceGap(
    existingCover: number,
    dependents: number = 0,
    isMetroCity: boolean = false,
    youngChildrenCount: number = 0,
  ): HealthInsuranceGap {
    // Base calculation
    let idealCover = 500000; // ₹5 lakhs base

    // Add for family members
    const familyMembers = dependents + 1; // Including self
    idealCover += 200000 * familyMembers; // ₹2L per family member

    // Add for metro city
    if (isMetroCity) {
      idealCover += 500000; // ₹5L additional
    }

    // Add for young children
    idealCover += 200000 * youngChildrenCount; // ₹2L per young child

    // Calculate gap
    const gap = Math.max(0, idealCover - existingCover);

    // Recommend super top-up if existing cover < ₹10L
    const superTopUpNeeded = existingCover < 1000000 ? Math.min(500000, gap) : 0;

    // Estimate premium (typically 0.5-0.8% of cover for family floater)
    const estimatedPremium = Math.round((gap * 0.007) / 100) * 100;

    // Determine priority
    let priority: InsurancePriority;
    if (existingCover < 500000) {
      priority = InsurancePriority.CRITICAL;
    } else if (existingCover < 1000000) {
      priority = InsurancePriority.HIGH;
    } else if (gap > 0) {
      priority = InsurancePriority.MEDIUM;
    } else {
      priority = InsurancePriority.ADEQUATE;
    }

    const recommendation =
      gap === 0
        ? 'Health insurance coverage is adequate'
        : superTopUpNeeded > 0
          ? `Consider a super top-up cover of ₹${(superTopUpNeeded / 100000).toFixed(1)} lakhs`
          : `Enhance health cover to ₹${(idealCover / 100000).toFixed(1)} lakhs`;

    return {
      idealCover: Math.round(idealCover),
      existingCover,
      gap: Math.round(gap),
      recommendation,
      superTopUpNeeded: Math.round(superTopUpNeeded),
      estimatedPremium,
      priority,
    };
  }

  /**
   * Assess motor insurance status
   */
  private assessMotorInsurance(
    ownsVehicle: boolean,
    hasMotorInsurance: boolean,
  ): MotorInsuranceStatus {
    if (!ownsVehicle) {
      return {
        ownsVehicle: false,
        hasCover: false,
        recommendation: 'Not applicable - you do not own a vehicle',
        priority: InsurancePriority.LOW,
      };
    }

    if (!hasMotorInsurance) {
      return {
        ownsVehicle: true,
        hasCover: false,
        recommendation:
          'URGENT: Motor insurance is mandatory. Apply for comprehensive cover immediately',
        priority: InsurancePriority.CRITICAL,
      };
    }

    return {
      ownsVehicle: true,
      hasCover: true,
      recommendation:
        'Motor insurance is active. Review renewal dates and consider upgrading to comprehensive cover if on third-party',
      priority: InsurancePriority.LOW,
    };
  }

  /**
   * Calculate critical illness insurance gap
   * Recommended for income > ₹10L: Cover = 50% of annual income
   */
  private calculateCriticalIllnessGap(
    annualIncome: number,
    existingCover: number = 0,
  ): CriticalIllnessGap {
    // Recommend critical illness cover for high-income individuals
    let idealCover = 0;
    let priority: InsurancePriority = InsurancePriority.OPTIONAL;

    if (annualIncome > 1000000) {
      // ₹10+ lakhs income
      idealCover = annualIncome * 0.5; // 50% of annual income
      priority = InsurancePriority.HIGH;
    } else if (annualIncome > 500000) {
      // ₹5-10 lakhs
      idealCover = annualIncome * 0.35;
      priority = InsurancePriority.MEDIUM;
    }

    const gap = Math.max(0, idealCover - existingCover);

    // Estimate premium (typically 0.3-0.5% of cover)
    const estimatedPremium = idealCover > 0 ? Math.round((gap * 0.004) / 100) * 100 : 0;

    const recommendation =
      idealCover === 0
        ? 'Critical illness cover is optional for your income level'
        : `Consider critical illness cover of ₹${(idealCover / 100000).toFixed(1)} lakhs`;

    return {
      idealCover: Math.round(idealCover),
      existingCover,
      gap: Math.round(gap),
      recommendation,
      estimatedPremium,
      priority,
    };
  }

  /**
   * Calculate overall insurance health score (0-100)
   */
  private calculateOverallScore(
    lifeGap: LifeInsuranceGap,
    healthGap: HealthInsuranceGap,
    motorStatus: MotorInsuranceStatus,
    criticalGap: CriticalIllnessGap,
  ): number {
    let score = 100;

    // Life insurance scoring
    if (lifeGap.priority === InsurancePriority.CRITICAL) score -= 40;
    else if (lifeGap.priority === InsurancePriority.HIGH) score -= 25;
    else if (lifeGap.priority === InsurancePriority.MEDIUM) score -= 10;
    else if (lifeGap.priority === InsurancePriority.LOW) score -= 5;

    // Health insurance scoring
    if (healthGap.priority === InsurancePriority.CRITICAL) score -= 30;
    else if (healthGap.priority === InsurancePriority.HIGH) score -= 20;
    else if (healthGap.priority === InsurancePriority.MEDIUM) score -= 10;
    else if (healthGap.priority === InsurancePriority.LOW) score -= 5;

    // Motor insurance scoring
    if (motorStatus.priority === InsurancePriority.CRITICAL) score -= 20;
    else if (motorStatus.priority === InsurancePriority.HIGH) score -= 10;

    // Critical illness scoring
    if (criticalGap.priority === InsurancePriority.HIGH) score -= 10;
    else if (criticalGap.priority === InsurancePriority.MEDIUM) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Create priority-ordered action items
   */
  private createActionItems(
    lifeGap: LifeInsuranceGap,
    healthGap: HealthInsuranceGap,
    motorStatus: MotorInsuranceStatus,
    criticalGap: CriticalIllnessGap,
  ): ActionItem[] {
    const items: ActionItem[] = [];

    // Add critical items first
    if (motorStatus.priority === InsurancePriority.CRITICAL) {
      items.push({
        priority: items.length + 1,
        action: 'Apply for comprehensive motor insurance immediately',
        productType: 'Motor Insurance',
        estimatedCost: 8000, // Approximate annual premium
        rationale: 'Motor insurance is legally mandatory',
      });
    }

    if (lifeGap.priority === InsurancePriority.CRITICAL) {
      items.push({
        priority: items.length + 1,
        action: `Apply for ₹${(lifeGap.gap / 1000000).toFixed(1)} crore term life insurance`,
        productType: 'Term Life Insurance',
        estimatedCost: lifeGap.estimatedPremium,
        rationale: `Life cover gap of ₹${(lifeGap.gap / 100000).toFixed(1)} lakhs identified`,
      });
    }

    if (healthGap.priority === InsurancePriority.CRITICAL) {
      items.push({
        priority: items.length + 1,
        action: `Enhance health cover to ₹${(healthGap.idealCover / 100000).toFixed(1)} lakhs`,
        productType: 'Health Insurance',
        estimatedCost: healthGap.estimatedPremium,
        rationale: 'Inadequate health cover for medical emergencies',
      });
    }

    if (lifeGap.priority === InsurancePriority.HIGH && items.length < 3) {
      items.push({
        priority: items.length + 1,
        action: `Apply for ₹${(lifeGap.gap / 1000000).toFixed(1)} crore additional term life insurance`,
        productType: 'Term Life Insurance',
        estimatedCost: lifeGap.estimatedPremium,
        rationale: 'Significant life cover gap for dependent protection',
      });
    }

    if (healthGap.priority === InsurancePriority.HIGH && items.length < 3) {
      items.push({
        priority: items.length + 1,
        action: `Get family health floater of ₹${(healthGap.idealCover / 100000).toFixed(1)} lakhs`,
        productType: 'Health Insurance',
        estimatedCost: healthGap.estimatedPremium,
        rationale: 'Current health cover is inadequate for family protection',
      });
    }

    if (
      healthGap.superTopUpNeeded > 0 &&
      items.length < 4
    ) {
      items.push({
        priority: items.length + 1,
        action: `Add super top-up cover of ₹${(healthGap.superTopUpNeeded / 100000).toFixed(1)} lakhs`,
        productType: 'Super Top-up Insurance',
        estimatedCost: Math.round(healthGap.superTopUpNeeded * 0.003),
        rationale: 'Cost-effective way to increase health coverage',
      });
    }

    if (
      criticalGap.priority === InsurancePriority.HIGH &&
      items.length < 5
    ) {
      items.push({
        priority: items.length + 1,
        action: `Apply for critical illness cover of ₹${(criticalGap.idealCover / 100000).toFixed(1)} lakhs`,
        productType: 'Critical Illness Insurance',
        estimatedCost: criticalGap.estimatedPremium,
        rationale: 'Protection against major health events for high earners',
      });
    }

    return items;
  }

  /**
   * Perform comprehensive insurance gap analysis
   */
  async analyzeInsuranceGaps(
    dto: InsuranceGapAnalysisDto,
  ): Promise<InsuranceGapAnalysisResponse> {
    try {
      // Calculate gaps for each insurance type
      const lifeGap = this.calculateLifeInsuranceGap(
        dto.annualIncome,
        dto.existingLifeCover,
        dto.totalLoans || 0,
        dto.dependents,
      );

      const healthGap = this.calculateHealthInsuranceGap(
        dto.existingHealthCover,
        dto.dependents,
        dto.isMetroCity || false,
        dto.youngChildrenCount || 0,
      );

      const motorStatus = this.assessMotorInsurance(
        true, // Assuming analysis is done when vehicle might be owned
        dto.hasMotorInsurance,
      );

      const criticalGap = this.calculateCriticalIllnessGap(
        dto.annualIncome,
        0,
      );

      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        lifeGap,
        healthGap,
        motorStatus,
        criticalGap,
      );

      // Create action items
      const actionItems = this.createActionItems(
        lifeGap,
        healthGap,
        motorStatus,
        criticalGap,
      );

      // Create summary
      const summary =
        overallScore < 40
          ? `URGENT: Your insurance coverage has critical gaps. Priority actions: ${actionItems.slice(0, 3).map((a) => a.productType).join(', ')}`
          : overallScore < 60
            ? `Your insurance coverage has gaps. Recommended actions: ${actionItems.slice(0, 2).map((a) => a.productType).join(', ')}`
            : `Your insurance coverage is reasonably adequate. Consider: ${actionItems.slice(0, 1).map((a) => a.productType).join(', ')}`;

      const totalEstimatedPremium =
        lifeGap.estimatedPremium +
        healthGap.estimatedPremium +
        motorStatus.priority === InsurancePriority.CRITICAL ? 8000 : 0 +
        criticalGap.estimatedPremium;

      const response: InsuranceGapAnalysisResponse = {
        id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientId: dto.clientId,
        overallInsuranceScore: overallScore,
        lifeInsuranceGap: lifeGap,
        healthInsuranceGap: healthGap,
        motorInsuranceStatus: motorStatus,
        criticalIllnessGap: criticalGap,
        totalEstimatedPremium,
        actionItems,
        summary,
        createdAt: new Date(),
      };

      this.logger.log(
        `Insurance gap analysis completed for client ${dto.clientId}: Score=${overallScore}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error analyzing insurance gaps for client ${dto.clientId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get insurance gap report for a client
   */
  async getInsuranceGapReport(
    clientId: string,
  ): Promise<InsuranceGapAnalysisResponse | null> {
    try {
      this.logger.log(
        `Fetching insurance gap report for client ${clientId}`,
      );
      // In production, fetch from database
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching insurance gap report for client ${clientId}:`,
        error,
      );
      throw error;
    }
  }
}
