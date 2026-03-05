import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InsurancePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  ADEQUATE = 'ADEQUATE',
}

export class LifeInsuranceGap {
  @ApiProperty({
    description: 'Ideal life insurance cover amount in rupees',
    example: 5000000,
  })
  idealCover: number;

  @ApiProperty({
    description: 'Existing life insurance cover in rupees',
    example: 1000000,
  })
  existingCover: number;

  @ApiProperty({
    description: 'Gap in coverage in rupees',
    example: 4000000,
  })
  gap: number;

  @ApiProperty({
    description: 'Recommendation text',
    example: 'You need 4 crores additional term life cover',
  })
  recommendation: string;

  @ApiProperty({
    description: 'Estimated annual premium for gap cover',
    example: 12000,
  })
  estimatedPremium: number;

  @ApiProperty({
    description: 'Priority level for addressing the gap',
    enum: InsurancePriority,
  })
  priority: InsurancePriority;
}

export class HealthInsuranceGap {
  @ApiProperty({
    description: 'Ideal health insurance cover amount in rupees',
    example: 500000,
  })
  idealCover: number;

  @ApiProperty({
    description: 'Existing health insurance cover in rupees',
    example: 300000,
  })
  existingCover: number;

  @ApiProperty({
    description: 'Gap in coverage in rupees',
    example: 200000,
  })
  gap: number;

  @ApiProperty({
    description: 'Recommendation text',
    example: 'Consider a family health floater of 5 lakhs',
  })
  recommendation: string;

  @ApiProperty({
    description: 'Super top-up cover needed in rupees',
    example: 100000,
  })
  superTopUpNeeded: number;

  @ApiProperty({
    description: 'Estimated annual premium for gap cover',
    example: 8000,
  })
  estimatedPremium: number;

  @ApiProperty({
    description: 'Priority level for addressing the gap',
    enum: InsurancePriority,
  })
  priority: InsurancePriority;
}

export class MotorInsuranceStatus {
  @ApiProperty({
    description: 'Does client own a vehicle',
    example: true,
  })
  ownsVehicle: boolean;

  @ApiProperty({
    description: 'Is motor insurance covered',
    example: true,
  })
  hasCover: boolean;

  @ApiProperty({
    description: 'Recommendation for motor insurance',
    example: 'Comprehensive cover recommended for 3-year-old vehicle',
  })
  recommendation: string;

  @ApiProperty({
    description: 'Priority level',
    enum: InsurancePriority,
  })
  priority: InsurancePriority;
}

export class CriticalIllnessGap {
  @ApiProperty({
    description: 'Ideal critical illness cover amount',
    example: 500000,
  })
  idealCover: number;

  @ApiProperty({
    description: 'Existing critical illness cover',
    example: 0,
  })
  existingCover: number;

  @ApiProperty({
    description: 'Gap in coverage',
    example: 500000,
  })
  gap: number;

  @ApiProperty({
    description: 'Recommendation text',
    example: 'Recommended for high-income individuals',
  })
  recommendation: string;

  @ApiProperty({
    description: 'Estimated annual premium',
    example: 5000,
  })
  estimatedPremium: number;

  @ApiProperty({
    description: 'Priority level',
    enum: InsurancePriority,
  })
  priority: InsurancePriority;
}

export class ActionItem {
  @ApiProperty({
    description: 'Sequence number',
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Action to take',
    example: 'Apply for ₹40 lakhs term life insurance',
  })
  action: string;

  @ApiProperty({
    description: 'Type of insurance product',
    example: 'Term Life Insurance',
  })
  productType: string;

  @ApiProperty({
    description: 'Estimated annual cost',
    example: 12000,
  })
  estimatedCost: number;

  @ApiProperty({
    description: 'Why this action is needed',
    example: 'Life cover gap of 40 lakhs identified',
  })
  rationale: string;
}

export class InsuranceGapAnalysisDto {
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
    description: 'Number of financial dependents',
    example: 2,
    minimum: 0,
    maximum: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  @IsNotEmpty()
  dependents: number;

  @ApiProperty({
    description: 'Existing life insurance cover in rupees',
    example: 1000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  existingLifeCover: number;

  @ApiProperty({
    description: 'Existing health insurance cover in rupees',
    example: 300000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  existingHealthCover: number;

  @ApiProperty({
    description: 'Does client have motor insurance',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  hasMotorInsurance: boolean;

  @ApiPropertyOptional({
    description: 'Total outstanding loans in rupees',
    example: 2000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalLoans?: number;

  @ApiPropertyOptional({
    description: 'Monthly living expenses in rupees',
    example: 50000,
    minimum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  monthlyExpenses?: number;

  @ApiPropertyOptional({
    description: 'Does client live in metro city (adds 5L to health cover)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isMetroCity?: boolean;

  @ApiPropertyOptional({
    description: 'Number of young children (adds 2L each to health cover)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  youngChildrenCount?: number;

  @ApiPropertyOptional({
    description: 'Notes about existing insurance',
    example: 'Has basic employer coverage',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InsuranceGapAnalysisResponse {
  @ApiProperty({
    description: 'Analysis ID',
    example: 'analysis-12345',
  })
  id: string;

  @ApiProperty({
    description: 'Client ID',
    example: 'client-12345',
  })
  clientId: string;

  @ApiProperty({
    description: 'Overall insurance health score (0-100)',
    example: 45,
    minimum: 0,
    maximum: 100,
  })
  overallInsuranceScore: number;

  @ApiProperty({
    description: 'Life insurance gap analysis',
    type: LifeInsuranceGap,
  })
  lifeInsuranceGap: LifeInsuranceGap;

  @ApiProperty({
    description: 'Health insurance gap analysis',
    type: HealthInsuranceGap,
  })
  healthInsuranceGap: HealthInsuranceGap;

  @ApiProperty({
    description: 'Motor insurance status',
    type: MotorInsuranceStatus,
  })
  motorInsuranceStatus: MotorInsuranceStatus;

  @ApiProperty({
    description: 'Critical illness insurance gap',
    type: CriticalIllnessGap,
  })
  criticalIllnessGap: CriticalIllnessGap;

  @ApiProperty({
    description: 'Total estimated annual premium for all gaps',
    example: 25000,
  })
  totalEstimatedPremium: number;

  @ApiProperty({
    description: 'Prioritized action items',
    type: [ActionItem],
  })
  actionItems: ActionItem[];

  @ApiProperty({
    description: 'Overall recommendation summary',
    example: 'You have significant insurance gaps. Priority: Term Life (40L), Health (2L), Critical Illness (5L)',
  })
  summary: string;

  @ApiProperty({
    description: 'Timestamp of analysis',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}
