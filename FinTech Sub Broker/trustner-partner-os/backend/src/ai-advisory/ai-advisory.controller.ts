import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { RiskProfileService } from './services/risk-profile.service';
import { GoalPlannerService } from './services/goal-planner.service';
import { InsuranceGapService } from './services/insurance-gap.service';
import { SmartRecommendationService } from './services/smart-recommendation.service';
import { NaturalLanguageQueryService } from './services/natural-query.service';

import {
  CreateRiskProfileDto,
  RiskProfileResponse,
} from './dto/risk-profile.dto';
import {
  CreateGoalPlanDto,
  GoalPlanResponse,
} from './dto/goal-plan.dto';
import {
  InsuranceGapAnalysisDto,
  InsuranceGapAnalysisResponse,
} from './dto/insurance-gap.dto';
import {
  SmartRecommendationDto,
  SmartRecommendationResponse,
} from './dto/smart-recommend.dto';
import {
  NaturalQueryDto,
  NaturalQueryResponse,
} from './dto/natural-query.dto';

/**
 * AI Advisory Engine Controller
 * REST API endpoints for advisory services
 * Requires JWT authentication
 * Some endpoints require specific roles (SUB_BROKER, CLIENT, etc.)
 */
@ApiTags('AI Advisory Engine')
@ApiBearerAuth('JWT')
@Controller('api/advisory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiAdvisoryController {
  private readonly logger = new Logger('AiAdvisoryController');

  constructor(
    private riskProfileService: RiskProfileService,
    private goalPlannerService: GoalPlannerService,
    private insuranceGapService: InsuranceGapService,
    private smartRecommendationService: SmartRecommendationService,
    private naturalQueryService: NaturalLanguageQueryService,
  ) {}

  /**
   * POST /api/advisory/risk-profile
   * Submit risk assessment questionnaire
   * Returns risk category and recommended allocation
   */
  @Post('risk-profile')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Create risk profile assessment',
    description:
      'Conducts SEBI-aligned 10-question risk assessment and returns risk category',
  })
  @ApiResponse({
    status: 201,
    description: 'Risk profile created successfully',
    type: RiskProfileResponse,
  })
  async createRiskProfile(
    @Body() dto: CreateRiskProfileDto,
  ): Promise<RiskProfileResponse> {
    this.logger.log(
      `Risk profile assessment requested for client: ${dto.clientId}`,
    );
    return await this.riskProfileService.createRiskProfile(dto);
  }

  /**
   * GET /api/advisory/risk-profile/:clientId
   * Retrieve client's current risk profile
   */
  @Get('risk-profile/:clientId')
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Get client risk profile',
    description: 'Retrieves the current risk profile assessment for a client',
  })
  @ApiResponse({
    status: 200,
    description: 'Risk profile retrieved',
    type: RiskProfileResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Risk profile not found for client',
  })
  async getRiskProfile(
    @Param('clientId') clientId: string,
  ): Promise<RiskProfileResponse | null> {
    this.logger.log(`Fetching risk profile for client: ${clientId}`);
    return await this.riskProfileService.getRiskProfile(clientId);
  }

  /**
   * POST /api/advisory/goal-plan
   * Create a goal-based investment plan
   * Calculates required SIP and tracks progress towards goal
   */
  @Post('goal-plan')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Create investment goal plan',
    description:
      'Creates a goal-based investment plan with SIP calculation and milestone tracking',
  })
  @ApiResponse({
    status: 201,
    description: 'Goal plan created successfully',
    type: GoalPlanResponse,
  })
  async createGoalPlan(
    @Body() dto: CreateGoalPlanDto,
  ): Promise<GoalPlanResponse> {
    this.logger.log(
      `Goal plan creation requested for client: ${dto.clientId}, Goal: ${dto.goalType}`,
    );
    return await this.goalPlannerService.createGoalPlan(dto);
  }

  /**
   * GET /api/advisory/goal-plan/:clientId
   * Retrieve all goal plans for a client
   */
  @Get('goal-plan/:clientId')
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Get client goal plans',
    description: 'Retrieves all investment goal plans for a client',
  })
  @ApiResponse({
    status: 200,
    description: 'Goal plans retrieved',
    type: [GoalPlanResponse],
  })
  async getClientGoalPlans(
    @Param('clientId') clientId: string,
  ): Promise<GoalPlanResponse[]> {
    this.logger.log(`Fetching goal plans for client: ${clientId}`);
    return await this.goalPlannerService.getClientGoalPlans(clientId);
  }

  /**
   * POST /api/advisory/insurance-gap
   * Run insurance gap analysis for a client
   * Identifies coverage gaps across life, health, motor, and critical illness
   */
  @Post('insurance-gap')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Conduct insurance gap analysis',
    description:
      'Comprehensive insurance gap analysis across all coverage types',
  })
  @ApiResponse({
    status: 201,
    description: 'Insurance gap analysis completed',
    type: InsuranceGapAnalysisResponse,
  })
  async analyzeInsuranceGaps(
    @Body() dto: InsuranceGapAnalysisDto,
  ): Promise<InsuranceGapAnalysisResponse> {
    this.logger.log(
      `Insurance gap analysis requested for client: ${dto.clientId}`,
    );
    return await this.insuranceGapService.analyzeInsuranceGaps(dto);
  }

  /**
   * GET /api/advisory/insurance-gap/:clientId
   * Retrieve latest insurance gap report for a client
   */
  @Get('insurance-gap/:clientId')
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Get insurance gap report',
    description: 'Retrieves the latest insurance gap analysis report',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance gap report retrieved',
    type: InsuranceGapAnalysisResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Insurance gap report not found',
  })
  async getInsuranceGapReport(
    @Param('clientId') clientId: string,
  ): Promise<InsuranceGapAnalysisResponse | null> {
    this.logger.log(`Fetching insurance gap report for client: ${clientId}`);
    return await this.insuranceGapService.getInsuranceGapReport(clientId);
  }

  /**
   * POST /api/advisory/smart-recommend
   * Get smart MF + Insurance recommendations
   * Combines risk profile, goals, and insurance status
   */
  @Post('smart-recommend')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Get smart recommendations',
    description:
      'Generates smart mutual fund and insurance recommendations based on client profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Smart recommendations generated',
    type: SmartRecommendationResponse,
  })
  async getSmartRecommendations(
    @Body() dto: SmartRecommendationDto,
  ): Promise<SmartRecommendationResponse> {
    this.logger.log(
      `Smart recommendations requested for client: ${dto.clientId}`,
    );
    return await this.smartRecommendationService.generateRecommendations(dto);
  }

  /**
   * POST /api/advisory/query
   * Natural language query processing
   * Partner asks questions like: "Best fund for 30yr aggressive investor"
   * Returns structured answer with recommendations
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Process natural language advisory query',
    description:
      'Process advisory queries in natural language using rule-based NLP',
  })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    type: NaturalQueryResponse,
  })
  async processAdvisoryQuery(
    @Body() dto: NaturalQueryDto,
  ): Promise<NaturalQueryResponse> {
    this.logger.log(`Advisory query received: "${dto.query}"`);
    return await this.naturalQueryService.processQuery(dto);
  }

  /**
   * GET /api/advisory/portfolio-health/:clientId
   * Get comprehensive portfolio health score
   * Combines insurance status, emergency fund, diversification, and asset allocation
   */
  @Get('portfolio-health/:clientId')
  @Roles(UserRole.SUB_BROKER, UserRole.POSP, UserRole.CLIENT)
  @ApiOperation({
    summary: 'Get portfolio health score',
    description:
      'Comprehensive portfolio health assessment including all coverage areas',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio health score retrieved',
    schema: {
      example: {
        clientId: 'client-12345',
        overallHealthScore: 65,
        lifeInsuranceScore: 40,
        healthInsuranceScore: 80,
        emergencyFundScore: 75,
        investmentScore: 60,
        rebalancingNeeded: false,
        lastAssessmentDate: '2024-01-15T10:30:00Z',
      },
    },
  })
  async getPortfolioHealth(
    @Param('clientId') clientId: string,
  ): Promise<Record<string, any>> {
    this.logger.log(`Portfolio health assessment requested for: ${clientId}`);

    // Placeholder for comprehensive portfolio health assessment
    return {
      clientId,
      overallHealthScore: 65,
      components: {
        lifeInsurance: { score: 40, status: 'Gap identified' },
        healthInsurance: { score: 80, status: 'Adequate' },
        emergencyFund: { score: 75, status: 'Good' },
        investment: { score: 60, status: 'Moderate diversification' },
      },
      recommendation:
        'Focus on increasing term life insurance coverage',
      assessedAt: new Date(),
    };
  }
}
