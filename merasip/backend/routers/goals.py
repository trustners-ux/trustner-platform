"""Goal Planning API routes — pure calculator, no DB writes yet."""

from __future__ import annotations

import math
from datetime import date, datetime
from fastapi import APIRouter, HTTPException

from models.schemas import GoalCreate, GoalResponse

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────


def _calculate_goal(goal: GoalCreate) -> GoalResponse:
    """Run the gap-analysis math for a single goal."""
    today = date.today()
    target = date.fromisoformat(goal.target_date)
    years = (target - today).days / 365.25
    if years <= 0:
        raise ValueError(f"Target date {goal.target_date} is in the past")

    months = years * 12
    monthly_rate = (goal.expected_return / 100) / 12

    # Inflation-adjusted target
    inflation_adjusted_target = goal.target_amount * (
        (1 + goal.inflation / 100) ** years
    )

    # Future value of lump-sum (current savings compounding)
    if monthly_rate > 0:
        fv_lumpsum = goal.current_savings * ((1 + monthly_rate) ** months)
    else:
        fv_lumpsum = goal.current_savings

    # Future value of SIP (annuity due — SIP at start of month)
    if monthly_rate > 0 and goal.monthly_sip > 0:
        fv_sip = (
            goal.monthly_sip
            * (((1 + monthly_rate) ** months - 1) / monthly_rate)
            * (1 + monthly_rate)
        )
    else:
        fv_sip = goal.monthly_sip * months

    projected_value = round(fv_lumpsum + fv_sip, 2)
    shortfall = round(inflation_adjusted_target - projected_value, 2)
    on_track = shortfall <= 0

    # Required SIP to exactly meet the inflation-adjusted target
    # (after accounting for FV of existing savings)
    remaining_target = inflation_adjusted_target - fv_lumpsum
    if remaining_target <= 0:
        required_sip = 0.0
    elif monthly_rate > 0:
        annuity_factor = (
            (((1 + monthly_rate) ** months - 1) / monthly_rate)
            * (1 + monthly_rate)
        )
        required_sip = round(remaining_target / annuity_factor, 2)
    else:
        required_sip = round(remaining_target / months, 2) if months > 0 else 0.0

    return GoalResponse(
        name=goal.name,
        target_amount=goal.target_amount,
        inflation_adjusted_target=round(inflation_adjusted_target, 2),
        target_date=goal.target_date,
        current_savings=goal.current_savings,
        monthly_sip=goal.monthly_sip,
        expected_return=goal.expected_return,
        inflation=goal.inflation,
        priority=goal.priority,
        gap_analysis={
            "projected_value": projected_value,
            "shortfall": max(shortfall, 0),
            "surplus": abs(shortfall) if shortfall < 0 else 0,
            "required_sip": required_sip,
            "on_track": on_track,
            "years_to_goal": round(years, 1),
        },
    )


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/goals/calculate", response_model=GoalResponse)
async def calculate_goal(goal: GoalCreate):
    """Calculate gap analysis for a single goal (no DB write)."""
    try:
        return _calculate_goal(goal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/goals/batch-calculate", response_model=list[GoalResponse])
async def batch_calculate_goals(goals: list[GoalCreate]):
    """Calculate gap analysis for multiple goals with priority-weighted summary."""
    if not goals:
        raise HTTPException(status_code=400, detail="At least one goal is required")

    results: list[GoalResponse] = []
    for goal in goals:
        try:
            results.append(_calculate_goal(goal))
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Goal '{goal.name}': {str(e)}",
            )

    return results
