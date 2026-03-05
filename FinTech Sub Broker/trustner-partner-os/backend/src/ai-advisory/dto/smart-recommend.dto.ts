import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskCategory } from './risk-profile.dto';

export enum FundCategory {
  LARGE_CAP = 'LARGE_CAP',
  MID_CAP = 'MID_CAP',
  SMALL_CAP = 'SMALL_CAP',
  MULTI_CAP = 'MULTI_CAP',
  FLEXI_CAP = 'FLEXI_CAP',
  SECTORAL = 'SECTORAL',
  THEMATIC = 'THEMATIC',
  BALANCED = 'BALANCED',
  BALANCED_ADVANTAGE = 'BALANCED_ADVANTAGE',
  HYBRID = 'HYBRID',
  DEBT = 'DEBT',
  LIQUID = 'LIQUID',
  ULTRA_SHORT = 'ULTRA_SHORT',
  SHORT_TERM_DEBT = 'SHORT_TERM_DEBT',
  INDEX_FUND = 'INDEX_FUND',
  INTERNATIONAL = 'INTERNATIONAL',
  GOLD = 'GOLD',
  INVESTMENT_GRADE_DEBT = 'INVESTMENT_GRADE_DEBT',
}

export enum InsuranceProductType {
  TERM_LIFE = 'TERM_LIFE',
  WHOLE_LIFE = 'WHOLE_LIFE',
  FAMILY_HEALTH_FLOATER = 'FAMILY_HEALTH_FLOATER',
  INDIVIDUAL_HEALTH = 'INDIVIDUAL_HEALTH',
  CRITICAL_ILLNESS = 'CRITICAL_ILLNESS',
  MOTOR_COMPREHENSIVE = 'MOTOR_COMPREHENSIVE',
  MOTOR_THIRD_PARTY = 'MOTOR_THIRD_PARTY',
  ACCIDENT = 'ACCIDENT',
  DISABILITY = 'DISABILITY',
}

export enum RecommendationUrgency {
  IMMEDIATE = 'IMMEDIATE',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  OPTIONAL = 'OPTIONAL',
}

export class MutualFundRecommendation {
  @ApiProperty({
    description: 'Fund category',
    enum: FundCategory,
  })
  category: FundCategory;

  @ApiProperty({
    description: 'Recommended allocation percentage',
    example: 40,
  })
  allocationPercentage: number;

  @ApiProperty({
    description: 'Reason for recommendation',
    example: 'Suitable for wealth creation in moderate-aggressive profile',
  })
  rationale: string;

  @ApiProperty({
    description: 'Why this category fits the profile',
    example: 'Multi-cap funds provide diversified exposure with growth potential',
  })
  explanation: string;

  @ApiProperty({
    description: 'Expected annual return range',
    example: '12-15%',
  })
  expectedReturnRange: string;

  @ApiProperty({
    description: 'Recommended SIP amount (if applicable)',
    example: 5000,
  })
  recommendedSIPAmount?: number;

  @ApiProperty({
    description: 'Risk level of this category',
    enum: RiskCategory,
  })
  riskLevel: RiskCategory;

  @ApiProperty({
    description: 'Time horizon suitability',
    example: '5-7 years minimum',
  })
  timeHorizon: string;
}

export class InsuranceRecommendation {
  @ApiProperty({
    description: 'Type of insurance product',
    enum: InsuranceProductType,
  })
  productType: InsuranceProductType;

  @ApiProperty({
    description: 'Recommended cover amount in rupees',
    example: 5000000,
  })
  recommendedCover: number;

  @ApiProperty({
    description: 'Reason for this recommendation',
    example: 'Gap identified in life insurance coverage',
  })
  rationale: string;

  @ApiProperty({
    description: 'Priority for action',
    enum: RecommendationUrgency,
  })
  urgency: RecommendationUrgency;

  @ApiProperty({
    description: 'Estimated annual premium',
    example: 12000,
  })
  estimatedPremium: number;

  @ApiProperty({
    description: 'Why this product is important',
    example: 'With 2 dependents, you need adequate life cover for their financial security',
  })
  explanation: string;

  @ApiProperty({
    description: 'Suggested action',
    example: 'Apply for 50 lakhs term life insurance with 20-year tenure',
  })
  suggestedAction: string;
}

export class PortfolioHealthCheckAlerts {
  @ApiProperty({
    description: 'Type of alert',
    example: 'HIGH_CONCENTRATION',
  })
  alertType: string;

  @ApiProperty({
    description: 'Alert message',
    example: '48% of portfolio is in Large Cap category - consider diversifying',
  })
  message: string;

  @ApiProperty({
    description: 'Severity level',
    enum: RecommendationUrgency,
  })
  severity: RecommendationUrgency;

  @ApiProperty({
    description: 'Recommended action',
    example: 'Move 10% to Mid Cap funds for better diversification',
  })
  suggestedAction: string;
}

export class SmartRecommendationDto {
  @ApiProperty({
    description: 'Client ID',
    example: 'client-12345',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Client age in years',
    example: 35,
    minimum: 18,
    maximum: 100,
  })
  @IsNumber()
  @Min(18)
  @Max(100)
  @IsNotEmpty()
  clientAge: number;

  @ApiProperty({
    description: 'Annual income in rupees',
    example: 1500000,
    minimum: 100000,
  })
  @IsNumber()
  @Min(100000)
  @IsNotEmpty()
  annualIncome: number;

  @ApiProperty({
    description: 'Risk profile category',
    enum: RiskCategory,
    example: RiskCategory.MODERATE,
  })
  @IsEnum(RiskCategory)
  @IsNotEmpty()
  riskProfile: RiskCategory;

  @ApiPropertyOptional({
    description: 'Number of financial dependents',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dependents?: number;

  @ApiPropertyOptional({
    description: 'Existing portfolio value in rupees',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  existingPortfolioValue?: number;

  @ApiPropertyOptional({
    description: 'Monthly surplus available for investment',
    example: 25000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlySurplus?: number;

  @ApiPropertyOptional({
    description: 'Active investment goals (array of goal types)',
    example: ['RETIREMENT', 'CHILD_EDUCATION'],
  })
  @IsOptional()
  @IsArray()
  activeGoals?: string[];

  @ApiPropertyOptional({
    description: 'Life insurance cover status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasLifeInsurance?: boolean;

  @ApiPropertyOptional({
    description: 'Health insurance cover status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  hasHealthInsurance?: boolean;

  @ApiPropertyOptional({
    description: 'Emergency fund status (in months)',
    example: 6,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  emergencyFundMonths?: number;

  @ApiPropertyOptional({
    description: 'Number of years invested in mutual funds',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsInvestedInMF?: number;

  @ApiPropertyOptional({
    description: 'Notes about client preferences',
    example: 'Prefers to start with index funds before diversifying',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SmartRecommendationResponse {
  @ApiProperty({
    description: 'Recommendation ID',
    example: 'rec-12345',
  })
  id: string;

  @ApiProperty({
    description: 'Client ID',
  })
  clientId: string;

  @ApiProperty({
    description: 'Portfolio health score (0-100)',
    example: 65,
    minimum: 0,
    maximum: 100,
  })
  portfolioHealthScore: number;

  @ApiProperty({
    description: 'Recommended mutual fund allocations',
    type: [MutualFundRecommendation],
  })
  mfRecommendations: MutualFundRecommendation[];

  @ApiProperty({
    description: 'Recommended insurance products',
    type: [InsuranceRecommendation],
  })
  insuranceRecommendations: InsuranceRecommendation[];

  @ApiProperty({
    description: 'Recommended monthly SIP amount (20% of surplus)',
    example: 5000,
  })
  recommendedMonthlySIP: number;

  @ApiProperty({
    description: 'Suggested annual step-up rate for SIP',
    example: 10,
    description: 'Percentage increase per year',
  })
  sipStepUpPercentage: number;

  @ApiProperty({
    description: 'Portfolio health check alerts and warnings',
    type: [PortfolioHealthCheckAlerts],
  })
  portfolioAlerts: PortfolioHealthCheckAlerts[];

  @ApiProperty({
    description: 'Rebalancing recommendation if needed',
    example: 'Your equity allocation drifted to 75% from target 60%. Consider rebalancing.',
  })
  rebalancingAdvice?: string;

  @ApiProperty({
    description: 'Diversification analysis',
    example: 'Good diversification across 5 fund categories. No concentration risk.',
  })
  diversificationAnalysis: string;

  @ApiProperty({
    description: 'Priority-ranked action items',
    type: [{ priority: 'number', action: 'string', timeframe: 'string' }],
  })
  actionItems: Array<{
    priority: number;
    action: string;
    timeframe: string;
  }>;

  @ApiProperty({
    description: 'Next review date',
    example: '2024-04-15',
  })
  nextReviewDate: string;

  @ApiProperty({
    description: 'Timestamp of recommendation',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}
