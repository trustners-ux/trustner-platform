import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { AiAdvisoryController } from './ai-advisory.controller';

// Services
import { RiskProfileService } from './services/risk-profile.service';
import { GoalPlannerService } from './services/goal-planner.service';
import { InsuranceGapService } from './services/insurance-gap.service';
import { SmartRecommendationService } from './services/smart-recommendation.service';
import { NaturalLanguageQueryService } from './services/natural-query.service';

/**
 * AI Advisory Engine Module
 * Rule-based + AI-powered advisory system for Trustner Partner OS
 *
 * Provides:
 * 1. Risk Profiling (SEBI-aligned 10-question assessment)
 * 2. Goal-based Investment Planning (SIP calculation, milestone tracking)
 * 3. Insurance Gap Analysis (Life, Health, Motor, Critical Illness)
 * 4. Smart Recommendations (MF + Insurance recommendations)
 * 5. Natural Language Query Processing (Rule-based NLP)
 *
 * All services are independent and can be used individually or in combination
 */
@Module({
  imports: [PrismaModule],
  controllers: [AiAdvisoryController],
  providers: [
    RiskProfileService,
    GoalPlannerService,
    InsuranceGapService,
    SmartRecommendationService,
    NaturalLanguageQueryService,
  ],
  exports: [
    RiskProfileService,
    GoalPlannerService,
    InsuranceGapService,
    SmartRecommendationService,
    NaturalLanguageQueryService,
  ],
})
export class AiAdvisoryModule {}
