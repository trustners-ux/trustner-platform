# AI Advisory Engine - Trustner Partner OS

A comprehensive rule-based + AI-powered advisory system built into the Trustner Partner OS backend. Enables sub-brokers and POSPs to provide intelligent financial advisory to their clients without being classified as RIAs (Registered Investment Advisors).

## Overview

The AI Advisory Engine consists of 5 independent services that can be used individually or in combination:

1. **Risk Profile Service** - SEBI-aligned risk assessment
2. **Goal Planner Service** - Goal-based investment planning
3. **Insurance Gap Service** - Insurance coverage analysis
4. **Smart Recommendation Service** - MF + Insurance recommendations
5. **Natural Language Query Service** - Rule-based NLP for advisory queries

## Architecture

```
ai-advisory/
├── ai-advisory.module.ts           # Main module
├── ai-advisory.controller.ts       # REST API endpoints
├── services/
│   ├── risk-profile.service.ts
│   ├── goal-planner.service.ts
│   ├── insurance-gap.service.ts
│   ├── smart-recommendation.service.ts
│   └── natural-query.service.ts
└── dto/
    ├── risk-profile.dto.ts
    ├── goal-plan.dto.ts
    ├── insurance-gap.dto.ts
    ├── smart-recommend.dto.ts
    └── natural-query.dto.ts
```

## REST API Endpoints

### Risk Profile Assessment

#### POST `/api/advisory/risk-profile`
Submit a 10-question risk assessment questionnaire.

**Request:**
```json
{
  "clientId": "client-12345",
  "ageBracket": "26-35",
  "incomeLevel": "BETWEEN_10_25L",
  "investmentHorizon": "BETWEEN_5_10YR",
  "existingInvestments": "MF",
  "portfolioDropReaction": "HOLD",
  "primaryGoal": "BALANCED_GROWTH",
  "financialDependents": 2,
  "emergencyFundMonths": 6,
  "loanEmiPercentage": 25,
  "insuranceCoverage": "moderate"
}
```

**Response:**
```json
{
  "score": 35,
  "category": "MODERATE",
  "description": "You are a moderate investor...",
  "recommendedAllocation": {
    "equity": 60,
    "debt": 30,
    "gold": 5,
    "international": 5
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Risk Categories (0-50 score):**
- 10-18: CONSERVATIVE
- 19-26: MODERATELY_CONSERVATIVE
- 27-34: MODERATE
- 35-42: MODERATELY_AGGRESSIVE
- 43-50: AGGRESSIVE

#### GET `/api/advisory/risk-profile/:clientId`
Retrieve a client's current risk profile.

---

### Goal-Based Investment Planning

#### POST `/api/advisory/goal-plan`
Create an investment plan for a financial goal.

**Request:**
```json
{
  "clientId": "client-12345",
  "goalType": "RETIREMENT",
  "customGoalName": null,
  "targetAmount": 1000000,
  "timelineYears": 10,
  "currentSavings": 100000,
  "monthlyContribution": 5000,
  "riskProfile": "MODERATE",
  "inflationRate": 5,
  "notes": "Planning for early retirement"
}
```

**Response:**
```json
{
  "id": "goal-12345",
  "clientId": "client-12345",
  "goalType": "RETIREMENT",
  "goalName": "Retirement Planning",
  "targetAmount": 1276280,
  "timelineYears": 10,
  "targetDate": "2034-01-15",
  "currentSavings": 100000,
  "requiredMonthlySIP": 6500,
  "expectedReturnPercentage": 12,
  "projectedFinalAmount": 1320000,
  "surplusShortfall": 43720,
  "riskProfile": "MODERATE",
  "recommendedAllocation": {
    "equity": 60,
    "debt": 30,
    "gold": 5,
    "international": 5
  },
  "milestones": [
    { "percentage": 25, "amount": 319070, "targetDate": "2025-01-15" },
    { "percentage": 50, "amount": 638140, "targetDate": "2029-01-15" },
    { "percentage": 75, "amount": 957210, "targetDate": "2032-01-15" },
    { "percentage": 100, "amount": 1276280, "targetDate": "2034-01-15" }
  ],
  "progressPercentage": 7,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Supported Goal Types:**
- RETIREMENT
- CHILD_EDUCATION
- HOUSE_PURCHASE
- WEALTH_CREATION
- EMERGENCY_FUND
- MARRIAGE
- CAR_PURCHASE
- VACATION
- CUSTOM

#### GET `/api/advisory/goal-plan/:clientId`
Retrieve all goal plans for a client.

---

### Insurance Gap Analysis

#### POST `/api/advisory/insurance-gap`
Conduct comprehensive insurance gap analysis.

**Request:**
```json
{
  "clientId": "client-12345",
  "clientAge": 35,
  "annualIncome": 1500000,
  "dependents": 2,
  "existingLifeCover": 1000000,
  "existingHealthCover": 300000,
  "hasMotorInsurance": true,
  "totalLoans": 2000000,
  "monthlyExpenses": 50000,
  "isMetroCity": true,
  "youngChildrenCount": 1
}
```

**Response:**
```json
{
  "id": "analysis-12345",
  "clientId": "client-12345",
  "overallInsuranceScore": 45,
  "lifeInsuranceGap": {
    "idealCover": 16000000,
    "existingCover": 1000000,
    "gap": 15000000,
    "recommendation": "You need additional ₹1.5 crore term life cover",
    "estimatedPremium": 45000,
    "priority": "CRITICAL"
  },
  "healthInsuranceGap": {
    "idealCover": 1800000,
    "existingCover": 300000,
    "gap": 1500000,
    "recommendation": "Consider a family health floater of 18 lakhs",
    "superTopUpNeeded": 500000,
    "estimatedPremium": 12000,
    "priority": "HIGH"
  },
  "motorInsuranceStatus": {
    "ownsVehicle": true,
    "hasCover": true,
    "recommendation": "Motor insurance is active...",
    "priority": "LOW"
  },
  "criticalIllnessGap": {
    "idealCover": 750000,
    "existingCover": 0,
    "gap": 750000,
    "recommendation": "Recommended for high-income individuals",
    "estimatedPremium": 3000,
    "priority": "HIGH"
  },
  "totalEstimatedPremium": 60000,
  "actionItems": [
    {
      "priority": 1,
      "action": "Apply for ₹1.5 crore term life insurance",
      "productType": "Term Life Insurance",
      "estimatedCost": 45000,
      "rationale": "Life cover gap of ₹1.5 crore identified"
    }
  ],
  "summary": "URGENT: Your insurance coverage has critical gaps...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET `/api/advisory/insurance-gap/:clientId`
Retrieve latest insurance gap report for a client.

---

### Smart Recommendations

#### POST `/api/advisory/smart-recommend`
Generate smart MF + Insurance recommendations.

**Request:**
```json
{
  "clientId": "client-12345",
  "clientAge": 35,
  "annualIncome": 1500000,
  "riskProfile": "MODERATE",
  "dependents": 2,
  "existingPortfolioValue": 500000,
  "monthlySurplus": 25000,
  "activeGoals": ["RETIREMENT", "CHILD_EDUCATION"],
  "hasLifeInsurance": false,
  "hasHealthInsurance": true,
  "emergencyFundMonths": 6,
  "yearsInvestedInMF": 3
}
```

**Response:**
```json
{
  "id": "rec-12345",
  "clientId": "client-12345",
  "portfolioHealthScore": 65,
  "mfRecommendations": [
    {
      "category": "MULTI_CAP",
      "allocationPercentage": 35,
      "rationale": "Core growth portfolio",
      "explanation": "Provides diversified equity exposure with growth focus",
      "expectedReturnRange": "11-13%",
      "riskLevel": "MODERATE",
      "timeHorizon": "5+ years"
    }
  ],
  "insuranceRecommendations": [
    {
      "productType": "TERM_LIFE",
      "recommendedCover": 15000000,
      "rationale": "Critical gap: No life insurance coverage identified",
      "urgency": "IMMEDIATE",
      "estimatedPremium": 45000,
      "explanation": "Term life insurance is the foundation of financial security",
      "suggestedAction": "Apply for 20-year term life insurance..."
    }
  ],
  "recommendedMonthlySIP": 5000,
  "sipStepUpPercentage": 10,
  "portfolioAlerts": [],
  "diversificationAnalysis": "Recommended allocation covers major asset classes...",
  "actionItems": [
    { "priority": 1, "action": "Apply for term life insurance", "timeframe": "1-2 weeks" }
  ],
  "nextReviewDate": "2024-04-15",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Natural Language Query Processing

#### POST `/api/advisory/query`
Process advisory queries in natural language.

**Request:**
```json
{
  "clientId": "client-12345",
  "query": "What is the best fund for a 30-year-old aggressive investor planning for 15 years?"
}
```

**Response:**
```json
{
  "id": "query-12345",
  "intent": "FUND_RECOMMENDATION",
  "entities": [
    { "type": "age", "value": "30", "confidence": 0.95 },
    { "type": "riskProfile", "value": "aggressive", "confidence": 0.9 },
    { "type": "duration", "value": "15 years", "confidence": 0.85 }
  ],
  "answer": "For a 30-year-old with aggressive risk profile and 15-year investment horizon, consider 70% Multi-cap/Small-cap funds with 20% Mid-cap for growth and 10% in Debt funds for stability.",
  "data": {
    "suggestedCategories": ["MULTI_CAP", "SMALL_CAP", "MID_CAP", "SECTORAL"],
    "allocation": { "equity": 80, "debt": 10, "international": 10 }
  },
  "suggestedActions": [
    "Review recommended fund categories",
    "Check fund performance history",
    "Consider starting SIP in recommended funds"
  ],
  "confidenceScore": 0.95,
  "disclaimer": "Note: This is based on general guidelines. Actual recommendations should consider individual financial situation...",
  "processedAt": "2024-01-15T10:30:00Z"
}
```

**Supported Query Intents:**
- FUND_RECOMMENDATION
- SIP_CALCULATION
- INSURANCE_QUERY
- RISK_QUERY
- GOAL_QUERY
- COMPARISON
- PORTFOLIO_HEALTH
- EXPENSE_TRACKING
- GENERAL_ADVICE
- UNKNOWN

---

### Portfolio Health Assessment

#### GET `/api/advisory/portfolio-health/:clientId`
Get comprehensive portfolio health score.

**Response:**
```json
{
  "clientId": "client-12345",
  "overallHealthScore": 65,
  "components": {
    "lifeInsurance": { "score": 40, "status": "Gap identified" },
    "healthInsurance": { "score": 80, "status": "Adequate" },
    "emergencyFund": { "score": 75, "status": "Good" },
    "investment": { "score": 60, "status": "Moderate diversification" }
  },
  "recommendation": "Focus on increasing term life insurance coverage",
  "assessedAt": "2024-01-15T10:30:00Z"
}
```

---

## Service Details

### 1. Risk Profile Service

**Purpose:** SEBI-aligned risk assessment questionnaire

**Key Features:**
- 10-question assessment covering age, income, horizon, experience, behavior, goals, dependents, emergency fund, debt, insurance
- Score range: 0-50
- 5 risk categories with recommended allocations
- Data-driven scoring with no subjective elements

**Formulas:**
- Age: Younger = higher score (5-1)
- Income: Higher = higher score (1-5)
- Horizon: Longer = higher score (1-5)
- Experience: More diversified = higher score (1-5)
- Behavior: Willing to buy on dips = higher score (1-5)
- Goals: Growth-oriented = higher score (1-5)
- Dependents: Fewer = higher score (5-1)
- Emergency fund: Larger = higher score (1-5)
- Debt: Lower = higher score (1-5)
- Insurance: Better coverage = higher score (1-5)

**Total Score Interpretation:**
- 10-18: CONSERVATIVE
- 19-26: MODERATELY_CONSERVATIVE
- 27-34: MODERATE
- 35-42: MODERATELY_AGGRESSIVE
- 43-50: AGGRESSIVE

### 2. Goal Planner Service

**Purpose:** Create structured investment plans for financial goals

**Key Features:**
- Supports 9 goal types (Retirement, Education, House, Wealth, Emergency, Marriage, Car, Vacation, Custom)
- Calculates required monthly SIP using FV formula
- Accounts for existing savings growth
- Generates 4 milestones (25%, 50%, 75%, 100%)
- Risk-based expected returns
- Inflation adjustment

**Formula for Required SIP:**
```
FV = P × [((1+r)^n - 1) / r] × (1+r)
P = FV / [((1+r)^n - 1) / r] × (1+r)

Where:
P = Monthly SIP payment
FV = Future Value (target amount after inflation adjustment)
r = Monthly rate (annual rate / 12)
n = Number of months
```

**Expected Returns by Risk Profile:**
- Conservative: 8%
- Moderately Conservative: 9%
- Moderate: 12%
- Moderately Aggressive: 13%
- Aggressive: 15%

### 3. Insurance Gap Service

**Purpose:** Identify insurance coverage gaps and provide recommendations

**Key Features:**
- Life insurance gap calculation (10x income + loans - existing)
- Health insurance gap (base 5L + 2L per member + metro/children adjustments)
- Motor insurance status check
- Critical illness recommendation (50% income for >10L earners)
- Overall insurance health score (0-100)
- Priority-ordered action items

**Life Insurance Rules:**
- Base formula: 10x annual income + total loans - existing cover
- Adjustment: +20% if dependents > 2
- Adjustment: +10% per young child
- Priority levels based on gap size relative to annual income

**Health Insurance Rules:**
- Base: ₹5 lakhs
- +₹2 lakhs per family member
- +₹5 lakhs for metro cities
- +₹2 lakhs per young child
- Super top-up recommended if existing < ₹10 lakhs

**Premium Estimations:**
- Life: ~0.3% of cover per annum
- Health: ~0.7% of cover per annum
- Critical Illness: ~0.4% of cover per annum

### 4. Smart Recommendation Service

**Purpose:** Provide comprehensive MF + Insurance recommendations

**Key Features:**
- Risk profile-based fund category recommendations
- 17 fund categories covered
- New investor specific recommendations (index funds)
- MF allocation percentages (5 portfolio profiles)
- Insurance recommendations with urgency levels
- Portfolio health check with alerts
- SIP calculation (20% of monthly surplus)
- 10% annual SIP step-up suggestion
- Rebalancing alerts if drift > 10%
- Overall portfolio health score

**Fund Categories:**
- Equity: Large Cap, Mid Cap, Small Cap, Multi Cap, Flexi Cap, Index Fund
- Specialized: Sectoral, Thematic
- Balanced: Balanced, Balanced Advantage, Hybrid
- Debt: Debt, Liquid, Ultra Short, Short Term, Investment Grade
- International: International, Gold

**Portfolio Health Score Components:**
- Life Insurance: +20
- Health Insurance: +15
- Emergency Fund (12+ months): +15
- Existing Portfolio (>500K): +10
- Regular contributions (>5K): +5
- Base: 40

### 5. Natural Language Query Service

**Purpose:** Process advisory queries in natural language using rule-based NLP

**Key Features:**
- Intent detection using keyword matching
- Entity extraction (age, amount, duration, risk, fund category)
- Pattern-based age extraction (30 years old, age 30, 30 yo)
- Amount extraction (₹10000, 10K, 10 lakhs, 1 crore)
- Duration extraction (5 years, long term, short term)
- Risk level extraction (aggressive, conservative, moderate)
- Fund category extraction
- 9 intent types supported
- Standalone operation (no external API dependency)
- Confidence scoring (0-1)

**Supported Intents:**
1. FUND_RECOMMENDATION - "best fund for", "recommend", "suggest fund"
2. SIP_CALCULATION - "SIP", "how much", "monthly investment"
3. INSURANCE_QUERY - "insurance", "cover", "health plan"
4. RISK_QUERY - "risk", "profile", "assessment"
5. GOAL_QUERY - "goal", "retirement", "education"
6. COMPARISON - "compare", "vs", "versus"
7. PORTFOLIO_HEALTH - "portfolio", "health", "performance"
8. EXPENSE_TRACKING - "expense", "spending", "budget"
9. GENERAL_ADVICE - "should I", "can I", "how to"

---

## Authentication & Authorization

All endpoints require:
- JWT authentication (Bearer token)
- Role-based access control

**Allowed Roles:**
- SUB_BROKER
- POSP
- CLIENT

Endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)` decorator.

---

## Example Usage Workflows

### Workflow 1: Complete Advisory for New Client

1. **Assessment Phase:**
   - POST `/api/advisory/risk-profile` - Complete risk assessment
   - POST `/api/advisory/insurance-gap` - Analyze insurance gaps

2. **Planning Phase:**
   - POST `/api/advisory/goal-plan` - Create retirement plan
   - POST `/api/advisory/goal-plan` - Create education plan

3. **Recommendation Phase:**
   - POST `/api/advisory/smart-recommend` - Get recommendations
   - GET `/api/advisory/portfolio-health/:clientId` - Check overall health

### Workflow 2: Partner Query-Driven Assistance

1. Partner asks: "What funds should we recommend to a 30-year-old aggressive investor?"
2. POST `/api/advisory/query` with natural language question
3. Get structured answer with fund categories and allocation
4. Optionally run full advisory for the specific client

### Workflow 3: Goal-Based Planning

1. Client wants to buy a house in 5 years with ₹50 lakhs target
2. POST `/api/advisory/goal-plan` with:
   - goalType: "HOUSE_PURCHASE"
   - targetAmount: 5000000
   - timelineYears: 5
   - currentSavings: 500000
3. Receive required monthly SIP and milestone tracking
4. Track progress quarterly

---

## Implementation Notes

### No RIA Classification Risk
- Service provides guidance, not recommendations for specific securities
- Fund categories recommended, not specific fund schemes
- Clients/partners still need to make final investment decisions
- Each recommendation includes disclaimer about personal financial assessment

### Production Ready
- All calculations use real formulas (not approximations)
- Proper error handling and logging
- Type-safe DTOs with validation
- Comprehensive API documentation with Swagger
- Role-based access control

### Extensibility
- Each service can be used independently
- Services are injectable and composable
- Easy to add new goal types, fund categories, or insurance products
- Rule-based NLP can be extended with more patterns

---

## Testing Recommendations

1. **Unit Tests:**
   - Test risk scoring logic for all 10 questions
   - Test SIP calculation against manual calculations
   - Test insurance gap formulas with edge cases
   - Test NLP intent detection with various phrasings

2. **Integration Tests:**
   - Test complete advisory workflow
   - Test all REST endpoints with valid/invalid inputs
   - Test authorization on all endpoints
   - Test data persistence to database

3. **Performance Tests:**
   - Load test natural language query processing
   - Benchmark SIP calculations for large portfolios
   - Test response times for all endpoints

---

## Future Enhancements

1. Database persistence for all assessments
2. Historical tracking and trend analysis
3. Portfolio rebalancing alerts and automation
4. Integration with actual fund performance data
5. Machine learning improvements to NLP
6. Multi-language support
7. WhatsApp/Telegram bot integration
8. PDF report generation for clients
9. Email notifications for milestones and alerts
10. Integration with trading platforms for actual investments

---

## Error Handling

All services throw proper NestJS exceptions:
- `BadRequestException` for invalid input
- `NotFoundException` for missing data
- `InternalServerErrorException` for unexpected errors

All errors are logged with context for debugging.

---

## Configuration

No additional configuration needed beyond core NestJS setup. Uses existing:
- PrismaService for database access
- JwtAuthGuard for authentication
- RolesGuard for authorization

---

## Support & Documentation

- Full API documentation available via Swagger at `/api-docs`
- Type definitions in DTO files
- Detailed comments in all service methods
- Example payloads provided above

For additional help, refer to service-specific implementations in `/services` directory.
