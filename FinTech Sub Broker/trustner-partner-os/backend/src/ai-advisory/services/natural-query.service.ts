import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NaturalQueryDto,
  NaturalQueryResponse,
  QueryIntent,
  QueryEntity,
} from '../dto/natural-query.dto';

/**
 * Natural Language Query Service
 * Rule-based NLP engine for partner advisory queries
 * No external AI API dependency - works standalone using keyword matching
 */
@Injectable()
export class NaturalLanguageQueryService {
  private readonly logger = new Logger('NaturalLanguageQueryService');

  constructor(private prisma: PrismaService) {}

  /**
   * Detect query intent using keyword matching
   */
  private detectIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();

    // Fund recommendation intent
    if (
      lowerQuery.includes('best fund') ||
      lowerQuery.includes('recommend') ||
      lowerQuery.includes('suggest fund') ||
      lowerQuery.includes('which fund') ||
      lowerQuery.includes('fund for')
    ) {
      return QueryIntent.FUND_RECOMMENDATION;
    }

    // SIP calculation intent
    if (
      lowerQuery.includes('sip') ||
      lowerQuery.includes('how much') ||
      lowerQuery.includes('monthly investment') ||
      lowerQuery.includes('monthly contribution') ||
      lowerQuery.includes('achieve') ||
      lowerQuery.includes('accumulate')
    ) {
      return QueryIntent.SIP_CALCULATION;
    }

    // Insurance query intent
    if (
      lowerQuery.includes('insurance') ||
      lowerQuery.includes('cover') ||
      lowerQuery.includes('health plan') ||
      lowerQuery.includes('life cover') ||
      lowerQuery.includes('critical illness')
    ) {
      return QueryIntent.INSURANCE_QUERY;
    }

    // Risk query intent
    if (
      lowerQuery.includes('risk') ||
      lowerQuery.includes('profile') ||
      lowerQuery.includes('aggressive') ||
      lowerQuery.includes('conservative') ||
      lowerQuery.includes('assessment')
    ) {
      return QueryIntent.RISK_QUERY;
    }

    // Goal query intent
    if (
      lowerQuery.includes('goal') ||
      lowerQuery.includes('retirement') ||
      lowerQuery.includes('education') ||
      lowerQuery.includes('house') ||
      lowerQuery.includes('marriage') ||
      lowerQuery.includes('plan')
    ) {
      return QueryIntent.GOAL_QUERY;
    }

    // Comparison intent
    if (
      lowerQuery.includes('compare') ||
      lowerQuery.includes('vs') ||
      lowerQuery.includes('versus') ||
      lowerQuery.includes('difference')
    ) {
      return QueryIntent.COMPARISON;
    }

    // Portfolio health
    if (
      lowerQuery.includes('portfolio') ||
      lowerQuery.includes('health') ||
      lowerQuery.includes('performance') ||
      lowerQuery.includes('diversif')
    ) {
      return QueryIntent.PORTFOLIO_HEALTH;
    }

    // Expense tracking
    if (
      lowerQuery.includes('expense') ||
      lowerQuery.includes('spending') ||
      lowerQuery.includes('budget')
    ) {
      return QueryIntent.EXPENSE_TRACKING;
    }

    // General advice
    if (
      lowerQuery.includes('should i') ||
      lowerQuery.includes('can i') ||
      lowerQuery.includes('how to') ||
      lowerQuery.includes('what should')
    ) {
      return QueryIntent.GENERAL_ADVICE;
    }

    return QueryIntent.UNKNOWN;
  }

  /**
   * Extract entities from query using pattern matching
   */
  private extractEntities(query: string): QueryEntity[] {
    const entities: QueryEntity[] = [];
    const lowerQuery = query.toLowerCase();

    // Age extraction patterns
    const agePatterns = [
      /(\d+)\s*(?:year|yr|yrs|years)\s*old/,
      /age\s*(?:of\s+)?(\d+)/,
      /(\d+)\s*y\.?o\./,
      /\b(\d+)\s*(?:year|yr)/,
    ];

    agePatterns.forEach((pattern) => {
      const match = query.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age >= 18 && age <= 100) {
          entities.push({
            type: 'age',
            value: age.toString(),
            confidence: 0.95,
          });
        }
      }
    });

    // Amount extraction patterns (rupees, lakhs, crores)
    const amountPatterns = [
      /₹\s*([\d,]+)/,
      /(\d+(?:,\d{3})*)\s*(?:rupee|rs|inr)/i,
      /(\d+)\s*(?:lakh|lacs|lac)/i,
      /(\d+)\s*crore/i,
    ];

    amountPatterns.forEach((pattern) => {
      const match = query.match(pattern);
      if (match) {
        let amount = match[1].replace(/,/g, '');
        // Handle lakhs and crores
        if (query.match(/lakh|lacs|lac/i)) {
          amount = (parseInt(amount) * 100000).toString();
        } else if (query.match(/crore/i)) {
          amount = (parseInt(amount) * 10000000).toString();
        }
        entities.push({
          type: 'amount',
          value: amount,
          confidence: 0.9,
        });
      }
    });

    // Duration/Timeline extraction
    const durationPatterns = [
      /(\d+)\s*(?:year|yr|yrs|years)/,
      /(\d+)\s*month/,
      /(\d+)\s*(?:day|days)/,
      /(?:short|long)\s*term/,
    ];

    durationPatterns.forEach((pattern) => {
      const match = query.match(pattern);
      if (match && match[1]) {
        entities.push({
          type: 'duration',
          value: `${match[1]} ${query.includes('month') ? 'months' : 'years'}`,
          confidence: 0.85,
        });
      }
    });

    // Risk profile extraction
    const riskKeywords = [
      {
        value: 'aggressive',
        pattern: /aggressive|maximum|high\s*(?:risk|growth)/,
      },
      {
        value: 'moderate',
        pattern: /moderate|balanced|medium/,
      },
      {
        value: 'conservative',
        pattern: /conservative|low\s*(?:risk|growth)|safe/,
      },
    ];

    riskKeywords.forEach((keyword) => {
      if (keyword.pattern.test(lowerQuery)) {
        entities.push({
          type: 'riskProfile',
          value: keyword.value,
          confidence: 0.9,
        });
      }
    });

    // Fund category extraction
    const fundKeywords = [
      'large cap',
      'mid cap',
      'small cap',
      'index fund',
      'balanced',
      'debt',
      'sectoral',
      'thematic',
      'gold',
      'international',
    ];

    fundKeywords.forEach((keyword) => {
      if (lowerQuery.includes(keyword)) {
        entities.push({
          type: 'fundCategory',
          value: keyword,
          confidence: 0.85,
        });
      }
    });

    return entities;
  }

  /**
   * Generate response for fund recommendation query
   */
  private generateFundRecommendationResponse(
    entities: QueryEntity[],
  ): { answer: string; data: Record<string, any> } {
    const ageEntity = entities.find((e) => e.type === 'age');
    const riskEntity = entities.find((e) => e.type === 'riskProfile');
    const durationEntity = entities.find((e) => e.type === 'duration');

    const age = ageEntity ? parseInt(ageEntity.value) : null;
    const risk = riskEntity?.value || 'moderate';
    const duration = durationEntity?.value || 'long term';

    let answer = '';
    let suggestedCategories: string[] = [];
    let allocation: Record<string, number> = {};

    if (age && age < 30) {
      answer = `For a ${age}-year-old with ${risk} risk profile and ${duration} investment horizon, consider an aggressive diversified approach with higher equity allocation.`;
      if (risk === 'aggressive') {
        suggestedCategories = [
          'SMALL_CAP',
          'MID_CAP',
          'MULTI_CAP',
          'SECTORAL',
        ];
        allocation = { equity: 85, debt: 10, international: 5 };
      } else if (risk === 'conservative') {
        suggestedCategories = ['LARGE_CAP', 'BALANCED', 'DEBT'];
        allocation = { equity: 50, debt: 40, gold: 10 };
      } else {
        suggestedCategories = [
          'MULTI_CAP',
          'LARGE_CAP',
          'MID_CAP',
          'BALANCED',
        ];
        allocation = { equity: 70, debt: 20, international: 5, gold: 5 };
      }
    } else if (age && age >= 30 && age < 45) {
      answer = `For a ${age}-year-old with ${risk} risk profile, a balanced approach with mix of growth and stability is ideal.`;
      if (risk === 'aggressive') {
        suggestedCategories = [
          'MULTI_CAP',
          'MID_CAP',
          'SECTORAL',
          'BALANCED',
        ];
        allocation = { equity: 75, debt: 15, international: 5, gold: 5 };
      } else if (risk === 'conservative') {
        suggestedCategories = [
          'LARGE_CAP',
          'BALANCED',
          'DEBT',
          'INDEX_FUND',
        ];
        allocation = { equity: 45, debt: 45, gold: 5, international: 5 };
      } else {
        suggestedCategories = [
          'MULTI_CAP',
          'BALANCED_ADVANTAGE',
          'LARGE_CAP',
          'MID_CAP',
        ];
        allocation = { equity: 60, debt: 30, international: 5, gold: 5 };
      }
    } else if (age && age >= 45) {
      answer = `For a ${age}-year-old with ${risk} risk profile nearing retirement, capital preservation with steady growth is important.`;
      if (risk === 'aggressive') {
        suggestedCategories = [
          'LARGE_CAP',
          'MULTI_CAP',
          'BALANCED',
          'DEBT',
        ];
        allocation = { equity: 55, debt: 40, gold: 5 };
      } else if (risk === 'conservative') {
        suggestedCategories = [
          'DEBT',
          'LIQUID',
          'LARGE_CAP',
          'BALANCED',
        ];
        allocation = { equity: 30, debt: 65, gold: 5 };
      } else {
        suggestedCategories = [
          'BALANCED',
          'LARGE_CAP',
          'DEBT',
          'BALANCED_ADVANTAGE',
        ];
        allocation = { equity: 45, debt: 45, gold: 10 };
      }
    } else {
      answer = `For a ${risk} investor with ${duration} time horizon, a diversified fund portfolio is recommended.`;
      suggestedCategories = [
        'MULTI_CAP',
        'BALANCED',
        'LARGE_CAP',
        'DEBT',
      ];
      allocation = { equity: 60, debt: 30, gold: 5, international: 5 };
    }

    return {
      answer,
      data: {
        suggestedCategories,
        allocation,
      },
    };
  }

  /**
   * Generate response for SIP calculation query
   */
  private generateSIPCalculationResponse(
    entities: QueryEntity[],
  ): { answer: string; data: Record<string, any> } {
    const amountEntity = entities.find((e) => e.type === 'amount');
    const durationEntity = entities.find((e) => e.type === 'duration');

    const targetAmount = amountEntity
      ? parseInt(amountEntity.value)
      : 1000000;
    const yearsMatch = (durationEntity?.value || '10 years').match(/\d+/);
    const years = yearsMatch ? parseInt(yearsMatch[0]) : 10;

    // Simple calculation: Target / (Years * 12) with 12% annual return
    const monthlyRate = 0.12 / 12; // 12% annual
    const months = years * 12;
    const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    const requiredSIP = Math.round(targetAmount / factor);

    const answer = `To accumulate ₹${(targetAmount / 100000).toFixed(1)} lakhs in ${years} years, you need to invest approximately ₹${requiredSIP.toLocaleString('en-IN')} per month through an SIP. This assumes an average return of 12% per annum.`;

    return {
      answer,
      data: {
        targetAmount,
        years,
        requiredMonthlySIP: requiredSIP,
        assumedAnnualReturn: '12%',
        totalInvestment: requiredSIP * months,
        projectedAmount: targetAmount,
      },
    };
  }

  /**
   * Generate response for insurance query
   */
  private generateInsuranceResponse(
    entities: QueryEntity[],
  ): { answer: string; data: Record<string, any> } {
    const ageEntity = entities.find((e) => e.type === 'age');
    const amountEntity = entities.find((e) => e.type === 'amount');

    const age = ageEntity ? parseInt(ageEntity.value) : 35;

    const answer = `Insurance needs assessment depends on your age, income, dependents, and existing coverage. For a ${age}-year-old, the recommended approach is:
1. Term Life Insurance: 10-12x annual income
2. Health Insurance: ₹5-10 lakhs family floater
3. Critical Illness: 50% of annual income (if income >10L)
4. Motor Insurance: Comprehensive cover if vehicle owner

Would you like me to conduct a detailed insurance gap analysis for your client?`;

    return {
      answer,
      data: {
        ageGroup: age < 30 ? 'Young' : age < 45 ? 'Working Age' : 'Pre-Retirement',
        recommendedCoverages: [
          'Term Life Insurance',
          'Health Insurance',
          'Motor Insurance',
        ],
      },
    };
  }

  /**
   * Generate response for risk assessment query
   */
  private generateRiskResponse(): { answer: string; data: Record<string, any> } {
    const answer = `Risk profiling is based on 10 key questions covering: age, income, investment horizon, existing investments, market reaction, financial goals, dependents, emergency fund, debt levels, and insurance coverage.

Based on the total score (0-50):
- 10-18: CONSERVATIVE - Suitable for debt funds, large-cap, balanced funds
- 19-26: MODERATELY CONSERVATIVE - Large-cap, hybrid, short-term debt
- 27-34: MODERATE - Multi-cap, balanced advantage, flexi-cap funds
- 35-42: MODERATELY AGGRESSIVE - Mid-cap, small-cap allocation, sectoral
- 43-50: AGGRESSIVE - Small-cap, sectoral, thematic funds

Would you like to conduct a risk assessment for your client?`;

    return {
      answer,
      data: {
        categories: [
          'CONSERVATIVE',
          'MODERATELY_CONSERVATIVE',
          'MODERATE',
          'MODERATELY_AGGRESSIVE',
          'AGGRESSIVE',
        ],
      },
    };
  }

  /**
   * Generate response for goal planning query
   */
  private generateGoalResponse(
    entities: QueryEntity[],
  ): { answer: string; data: Record<string, any> } {
    const amountEntity = entities.find((e) => e.type === 'amount');
    const durationEntity = entities.find((e) => e.type === 'duration');

    const targetAmount = amountEntity
      ? parseInt(amountEntity.value)
      : 5000000;
    const yearsMatch = (durationEntity?.value || '15 years').match(/\d+/);
    const years = yearsMatch ? parseInt(yearsMatch[0]) : 15;

    const answer = `Goal planning involves creating a structured investment plan to achieve financial objectives. For a goal of ₹${(targetAmount / 100000).toFixed(1)} lakhs in ${years} years:

1. Calculate required monthly SIP based on target amount and timeline
2. Adjust for inflation (typically 5% annually)
3. Allocate funds across asset classes based on risk profile and timeline
4. Track progress with quarterly/annual milestones
5. Rebalance portfolio periodically

Key milestones would be set at 25%, 50%, 75%, and 100% completion of the goal.`;

    return {
      answer,
      data: {
        goalAmount: targetAmount,
        timelineYears: years,
        recommendedApproach: [
          'Define goal clearly',
          'Calculate required SIP',
          'Choose appropriate funds',
          'Set milestones',
          'Track progress',
        ],
      },
    };
  }

  /**
   * Process natural language query and generate response
   */
  async processQuery(dto: NaturalQueryDto): Promise<NaturalQueryResponse> {
    try {
      // Detect intent
      const intent = this.detectIntent(dto.query);

      // Extract entities
      const entities = this.extractEntities(dto.query);

      let answer = '';
      let data: Record<string, any> = {};
      let suggestedActions: string[] = [];

      // Generate response based on intent
      switch (intent) {
        case QueryIntent.FUND_RECOMMENDATION: {
          const response = this.generateFundRecommendationResponse(entities);
          answer = response.answer;
          data = response.data;
          suggestedActions = [
            'Review recommended fund categories',
            'Check fund performance history',
            'Consider starting SIP in recommended funds',
          ];
          break;
        }

        case QueryIntent.SIP_CALCULATION: {
          const response = this.generateSIPCalculationResponse(entities);
          answer = response.answer;
          data = response.data;
          suggestedActions = [
            'Set up monthly SIP with recommended amount',
            'Enable auto-debit from bank account',
            'Review fund performance quarterly',
          ];
          break;
        }

        case QueryIntent.INSURANCE_QUERY: {
          const response = this.generateInsuranceResponse(entities);
          answer = response.answer;
          data = response.data;
          suggestedActions = [
            'Conduct insurance gap analysis',
            'Review current coverage',
            'Get quotes from recommended insurers',
          ];
          break;
        }

        case QueryIntent.RISK_QUERY: {
          const response = this.generateRiskResponse();
          answer = response.answer;
          data = response.data;
          suggestedActions = [
            'Complete risk assessment questionnaire',
            'Understand risk category recommendations',
            'Get personalized fund allocation',
          ];
          break;
        }

        case QueryIntent.GOAL_QUERY: {
          const response = this.generateGoalResponse(entities);
          answer = response.answer;
          data = response.data;
          suggestedActions = [
            'Define goal parameters clearly',
            'Calculate required monthly investment',
            'Create investment plan for goal',
          ];
          break;
        }

        case QueryIntent.COMPARISON:
          answer =
            'To make meaningful comparisons between investment options, I need more specific details. Would you like to compare specific fund categories, investment products, or insurance options? Please provide details about what you want to compare.';
          suggestedActions = [
            'Specify what to compare',
            'Provide comparison parameters',
            'Get detailed analysis',
          ];
          break;

        case QueryIntent.PORTFOLIO_HEALTH:
          answer =
            'Portfolio health assessment involves reviewing asset allocation, diversification, concentration risks, and alignment with goals. Please provide details about existing holdings to conduct a health check.';
          suggestedActions = [
            'Share portfolio details',
            'Analyze current allocation',
            'Get rebalancing recommendations',
          ];
          break;

        default:
          answer =
            'I can help with: fund recommendations, SIP calculations, insurance gap analysis, risk profiling, and goal planning. What would you like assistance with?';
          suggestedActions = [
            'Ask about fund recommendations',
            'Request SIP calculation',
            'Get insurance gap analysis',
          ];
      }

      const response: NaturalQueryResponse = {
        id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        intent,
        entities,
        answer,
        data,
        suggestedActions,
        confidenceScore:
          intent === QueryIntent.UNKNOWN ? 0.5 : 0.8 + entities.length * 0.05,
        disclaimer:
          'This is a general guidance based on rule-based analysis. For specific investment decisions, conduct proper risk profiling and goal assessment.',
        processedAt: new Date(),
      };

      this.logger.log(
        `Query processed: Intent=${intent}, Confidence=${response.confidenceScore}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Error processing query:', error);
      throw error;
    }
  }
}
