import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum QueryIntent {
  FUND_RECOMMENDATION = 'FUND_RECOMMENDATION',
  SIP_CALCULATION = 'SIP_CALCULATION',
  INSURANCE_QUERY = 'INSURANCE_QUERY',
  RISK_QUERY = 'RISK_QUERY',
  GOAL_QUERY = 'GOAL_QUERY',
  COMPARISON = 'COMPARISON',
  PORTFOLIO_HEALTH = 'PORTFOLIO_HEALTH',
  EXPENSE_TRACKING = 'EXPENSE_TRACKING',
  GENERAL_ADVICE = 'GENERAL_ADVICE',
  UNKNOWN = 'UNKNOWN',
}

export class QueryEntity {
  @ApiProperty({
    description: 'Type of entity (age, amount, duration, risk, product)',
    example: 'age',
  })
  type: string;

  @ApiProperty({
    description: 'Extracted value',
    example: '30',
  })
  value: string;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.95,
  })
  confidence: number;
}

export class NaturalQueryDto {
  @ApiProperty({
    description: 'Client ID (optional for general queries)',
    example: 'client-12345',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({
    description: 'Natural language query from partner',
    example: 'What is the best fund for a 30-year-old aggressive investor planning for 15 years?',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Additional context or parameters',
    example: { investmentAmount: 100000, riskProfile: 'aggressive' },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class NaturalQueryResponse {
  @ApiProperty({
    description: 'Unique ID for this query',
    example: 'query-12345',
  })
  id: string;

  @ApiProperty({
    description: 'Detected query intent',
    enum: QueryIntent,
  })
  intent: QueryIntent;

  @ApiProperty({
    description: 'Extracted entities from query',
    type: [QueryEntity],
  })
  entities: QueryEntity[];

  @ApiProperty({
    description: 'Main response/answer to the query',
    example: 'For a 30-year-old with aggressive risk profile and 15-year horizon, consider 70% Multi-cap/Small-cap funds with 20% Mid-cap for growth and 10% in Debt funds for stability.',
  })
  answer: string;

  @ApiProperty({
    description: 'Structured data related to the query',
    example: {
      suggestedCategories: [
        'MULTI_CAP',
        'SMALL_CAP',
        'MID_CAP',
        'SECTORAL',
      ],
      allocation: {
        equity: 80,
        debt: 10,
        international: 10,
      },
    },
  })
  data: Record<string, any>;

  @ApiProperty({
    description: 'Suggested follow-up actions',
    example: [
      'Review risk profile assessment',
      'Start with monthly SIP of 10000',
      'Review portfolio allocation in 6 months',
    ],
  })
  suggestedActions: string[];

  @ApiProperty({
    description: 'Confidence level in the response (0-1)',
    example: 0.85,
  })
  confidenceScore: number;

  @ApiProperty({
    description: 'Additional recommendations or disclaimers',
    example: 'Note: This is based on general guidelines. Actual recommendations should consider individual financial situation, goals, and complete risk assessment.',
  })
  disclaimer?: string;

  @ApiProperty({
    description: 'Timestamp of query processing',
    example: '2024-01-15T10:30:00Z',
  })
  processedAt: Date;
}
