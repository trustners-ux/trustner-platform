"""Risk Profiling & Health Score API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.schemas import (
    RiskQuestion,
    RiskProfileRequest,
    RiskProfileResponse,
    HealthScoreRequest,
    HealthScoreResponse,
    GapAnalysisResponse,
)
from engines.risk_profiler import get_questions, calculate_risk_profile
from engines.health_score import calculate_health_score
from engines.model_portfolios import (
    get_model_portfolios,
    get_model_for_profile,
    calculate_gap_analysis,
)

router = APIRouter()


# ── Risk Profiling ───────────────────────────────────────────────────────────


@router.get("/risk-profile/questions", response_model=list[RiskQuestion])
async def risk_questions():
    """Return the 10 risk-profiling questions with weighted options."""
    return get_questions()


@router.post("/risk-profile/calculate", response_model=RiskProfileResponse)
async def risk_calculate(req: RiskProfileRequest):
    """Accept answer weights and return risk profile + model allocation."""
    try:
        result = calculate_risk_profile(req.answers)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Health Score ─────────────────────────────────────────────────────────────


@router.post("/health-score", response_model=HealthScoreResponse)
async def health_score(req: HealthScoreRequest):
    """Score a portfolio across multiple health dimensions."""
    try:
        result = calculate_health_score(req.funds, req.risk_profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Model Portfolios ────────────────────────────────────────────────────────


@router.get("/model-portfolios")
async def model_portfolios():
    """Return all 5 model portfolio templates."""
    return get_model_portfolios()


@router.get("/model-portfolios/{profile}")
async def model_portfolio_by_profile(profile: str):
    """Return the model portfolio for a specific risk profile."""
    result = get_model_for_profile(profile)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No model portfolio found for profile: {profile}",
        )
    return result


class GapAnalysisRequest(BaseModel):
    funds: list[dict]
    profile: str


@router.post("/model-portfolios/gap-analysis", response_model=GapAnalysisResponse)
async def model_portfolio_gap_analysis(req: GapAnalysisRequest):
    """Compare actual fund allocation against a target model portfolio."""
    try:
        model = get_model_for_profile(req.profile)
        if model is None:
            raise HTTPException(status_code=404, detail=f"No model for profile: {req.profile}")
        result = calculate_gap_analysis(req.funds, model)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
