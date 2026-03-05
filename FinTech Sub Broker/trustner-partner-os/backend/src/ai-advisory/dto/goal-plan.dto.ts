import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskCategory } from './risk-profile.dto';

export enum GoalType {
  RETIREMENT = 'RETIREMENT',
  CHILD_EDUCATION = 'CHILD_EDUCATION',
  HOUSE_PURCHASE = 'HOUSE_PURCHASE',
  WEALTH_CREATION = 'WEALTH_CREATION',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  MARRIAGE = 'MARRIAGE',
  CAR_PURCHASE = 'CAR_PURCHASE',
  VACATION = 'VACATION',
  CUSTOM = 'CUSTOM',
}

export class GoalAllocation {
  @ApiProperty({
    description: 'Equity allocation percentage',
    example: 60,
  })
  equity: number;

  @ApiProperty({
    description: 'Debt allocation percentage',
    example: 30,
  })
  debt: number;

  @ApiProperty({
    description: 'Gold allocation percentage',
    example: 5,
  })
  gold: number;

  @ApiProperty({
    description: 'International allocation percentage',
    example: 5,
  })
  international: number;
}

export class Milestone {
  @ApiProperty({
    description: 'Milestone percentage completion',
    example: 25,
  })
  percentage: number;

  @ApiProperty({
    description: 'Target amount at this milestone',
    example: 250000,
  })
  amount: number;

  @ApiProperty({
    description: 'Expected date to reach milestone',
    example: '2025-12-31',
  })
  targetDate: string;
}

export class CreateGoalPlanDto {
  @ApiProperty({
    description: 'Client ID',
    example: 'client-12345',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Type of financial goal',
    enum: GoalType,
    example: GoalType.RETIREMENT,
  })
  @IsEnum(GoalType)
  @IsNotEmpty()
  goalType: GoalType;

  @ApiPropertyOptional({
    description: 'Custom goal name (if goalType is CUSTOM)',
    example: 'Dream Vacation to Europe',
  })
  @IsOptional()
  @IsString()
  customGoalName?: string;

  @ApiProperty({
    description: 'Target amount in rupees',
    example: 1000000,
    minimum: 1000,
  })
  @IsNumber()
  @Min(1000)
  @IsNotEmpty()
  targetAmount: number;

  @ApiProperty({
    description: 'Timeline in years',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsNotEmpty()
  timelineYears: number;

  @ApiProperty({
    description: 'Current savings towards this goal in rupees',
    example: 100000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  currentSavings: number;

  @ApiProperty({
    description: 'Monthly contribution amount in rupees',
    example: 5000,
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  @IsNotEmpty()
  monthlyContribution: number;

  @ApiProperty({
    description: 'Risk profile for this goal',
    enum: RiskCategory,
    example: RiskCategory.MODERATE,
  })
  @IsEnum(RiskCategory)
  @IsNotEmpty()
  riskProfile: RiskCategory;

  @ApiPropertyOptional({
    description: 'Annual inflation rate (percentage)',
    example: 5,
    minimum: 0,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  inflationRate?: number;

  @ApiPropertyOptional({
    description: 'Notes about the goal',
    example: 'Planning for early retirement in good health',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GoalPlanResponse {
  @ApiProperty({
    description: 'Goal plan ID',
    example: 'goal-12345',
  })
  id: string;

  @ApiProperty({
    description: 'Client ID',
    example: 'client-12345',
  })
  clientId: string;

  @ApiProperty({
    description: 'Goal type',
    enum: GoalType,
  })
  goalType: GoalType;

  @ApiProperty({
    description: 'Goal name/title',
    example: 'Retirement Planning',
  })
  goalName: string;

  @ApiProperty({
    description: 'Target amount in rupees',
    example: 1000000,
  })
  targetAmount: number;

  @ApiProperty({
    description: 'Timeline in years',
    example: 10,
  })
  timelineYears: number;

  @ApiProperty({
    description: 'Target date for goal completion',
    example: '2034-01-15',
  })
  targetDate: string;

  @ApiProperty({
    description: 'Current savings towards goal',
    example: 100000,
  })
  currentSavings: number;

  @ApiProperty({
    description: 'Monthly SIP required to achieve goal',
    example: 6500,
  })
  requiredMonthlySIP: number;

  @ApiProperty({
    description: 'Expected returns percentage per annum',
    example: 12,
  })
  expectedReturnPercentage: number;

  @ApiProperty({
    description: 'Projected final amount after all contributions and returns',
    example: 1050000,
  })
  projectedFinalAmount: number;

  @ApiProperty({
    description: 'Surplus or shortfall amount',
    example: 50000,
  })
  surplusShortfall: number;

  @ApiProperty({
    description: 'Risk category for this goal',
    enum: RiskCategory,
  })
  riskProfile: RiskCategory;

  @ApiProperty({
    description: 'Recommended asset allocation',
    type: GoalAllocation,
  })
  recommendedAllocation: GoalAllocation;

  @ApiProperty({
    description: 'Milestones towards goal completion',
    type: [Milestone],
  })
  milestones: Milestone[];

  @ApiProperty({
    description: 'Overall progress percentage',
    example: 50,
  })
  progressPercentage: number;

  @ApiProperty({
    description: 'Timestamp of plan creation',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp of last update',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
