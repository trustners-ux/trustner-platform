import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AgeBracket {
  BRACKET_18_25 = '18-25',
  BRACKET_26_35 = '26-35',
  BRACKET_36_45 = '36-45',
  BRACKET_46_55 = '46-55',
  BRACKET_55_PLUS = '55+',
}

export enum IncomeLevel {
  LESS_THAN_5L = 'LESS_THAN_5L',
  BETWEEN_5_10L = 'BETWEEN_5_10L',
  BETWEEN_10_25L = 'BETWEEN_10_25L',
  BETWEEN_25_50L = 'BETWEEN_25_50L',
  MORE_THAN_50L = 'MORE_THAN_50L',
}

export enum InvestmentHorizon {
  LESS_THAN_1YR = 'LESS_THAN_1YR',
  BETWEEN_1_3YR = 'BETWEEN_1_3YR',
  BETWEEN_3_5YR = 'BETWEEN_3_5YR',
  BETWEEN_5_10YR = 'BETWEEN_5_10YR',
  MORE_THAN_10YR = 'MORE_THAN_10YR',
}

export enum ExistingInvestments {
  NONE = 'NONE',
  FD_ONLY = 'FD_ONLY',
  MF = 'MF',
  STOCKS = 'STOCKS',
  DIVERSIFIED = 'DIVERSIFIED',
}

export enum PortfolioDropReaction {
  SELL_ALL = 'SELL_ALL',
  SELL_SOME = 'SELL_SOME',
  HOLD = 'HOLD',
  BUY_MORE = 'BUY_MORE',
  BUY_AGGRESSIVELY = 'BUY_AGGRESSIVELY',
}

export enum PrimaryGoal {
  CAPITAL_SAFETY = 'CAPITAL_SAFETY',
  REGULAR_INCOME = 'REGULAR_INCOME',
  BALANCED_GROWTH = 'BALANCED_GROWTH',
  WEALTH_CREATION = 'WEALTH_CREATION',
  AGGRESSIVE_GROWTH = 'AGGRESSIVE_GROWTH',
}

export enum RiskCategory {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATELY_CONSERVATIVE = 'MODERATELY_CONSERVATIVE',
  MODERATE = 'MODERATE',
  MODERATELY_AGGRESSIVE = 'MODERATELY_AGGRESSIVE',
  AGGRESSIVE = 'AGGRESSIVE',
}

export class RecommendedAllocation {
  @ApiProperty({
    description: 'Recommended equity allocation percentage',
    example: 60,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  equity: number;

  @ApiProperty({
    description: 'Recommended debt allocation percentage',
    example: 30,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  debt: number;

  @ApiProperty({
    description: 'Recommended gold allocation percentage',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  gold: number;

  @ApiProperty({
    description: 'Recommended international allocation percentage',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  international: number;
}

export class CreateRiskProfileDto {
  @ApiProperty({
    description: 'Client ID',
    example: 'client-12345',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Q1: Age bracket',
    enum: AgeBracket,
    example: AgeBracket.BRACKET_26_35,
  })
  @IsEnum(AgeBracket)
  @IsNotEmpty()
  ageBracket: AgeBracket;

  @ApiProperty({
    description: 'Q2: Annual income level',
    enum: IncomeLevel,
    example: IncomeLevel.BETWEEN_10_25L,
  })
  @IsEnum(IncomeLevel)
  @IsNotEmpty()
  incomeLevel: IncomeLevel;

  @ApiProperty({
    description: 'Q3: Investment horizon',
    enum: InvestmentHorizon,
    example: InvestmentHorizon.BETWEEN_5_10YR,
  })
  @IsEnum(InvestmentHorizon)
  @IsNotEmpty()
  investmentHorizon: InvestmentHorizon;

  @ApiProperty({
    description: 'Q4: Existing investments',
    enum: ExistingInvestments,
    example: ExistingInvestments.MF,
  })
  @IsEnum(ExistingInvestments)
  @IsNotEmpty()
  existingInvestments: ExistingInvestments;

  @ApiProperty({
    description: 'Q5: Reaction to 20% portfolio drop',
    enum: PortfolioDropReaction,
    example: PortfolioDropReaction.HOLD,
  })
  @IsEnum(PortfolioDropReaction)
  @IsNotEmpty()
  portfolioDropReaction: PortfolioDropReaction;

  @ApiProperty({
    description: 'Q6: Primary investment goal',
    enum: PrimaryGoal,
    example: PrimaryGoal.BALANCED_GROWTH,
  })
  @IsEnum(PrimaryGoal)
  @IsNotEmpty()
  primaryGoal: PrimaryGoal;

  @ApiProperty({
    description: 'Q7: Number of financial dependents',
    example: 2,
    minimum: 0,
    maximum: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  financialDependents: number;

  @ApiProperty({
    description: 'Q8: Emergency fund status (in months)',
    example: 6,
    minimum: 0,
    maximum: 24,
  })
  @IsNumber()
  @Min(0)
  @Max(24)
  emergencyFundMonths: number;

  @ApiProperty({
    description: 'Q9: Loan/EMI as percentage of income',
    example: 25,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  loanEmiPercentage: number;

  @ApiProperty({
    description: 'Q10: Insurance coverage status',
    example: 'moderate',
  })
  @IsString()
  @IsNotEmpty()
  insuranceCoverage: string;

  @ApiPropertyOptional({
    description: 'Optional notes about the client',
    example: 'First-time investor, seeking guidance',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RiskProfileResponse {
  @ApiProperty({
    description: 'Total risk score (0-50)',
    example: 35,
  })
  score: number;

  @ApiProperty({
    description: 'Risk category classification',
    enum: RiskCategory,
    example: RiskCategory.MODERATE,
  })
  category: RiskCategory;

  @ApiProperty({
    description: 'Detailed description of risk profile',
    example: 'You are a moderate risk investor suitable for balanced funds and multi-cap funds',
  })
  description: string;

  @ApiProperty({
    description: 'Recommended asset allocation',
    type: RecommendedAllocation,
  })
  recommendedAllocation: RecommendedAllocation;

  @ApiProperty({
    description: 'Timestamp of assessment',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}
