"""MeraSIP Portfolio Scorecard — API route for PDF generation."""

from fastapi import APIRouter
from fastapi.responses import Response

router = APIRouter()


@router.post("/portfolio-review/generate")
async def generate_scorecard(data: dict):
    """Generate a branded PDF Portfolio Scorecard.

    Expects JSON body with:
    - investor: {name, pan, email, mobile, report_date}
    - summary: {total_invested, total_value, total_gain, abs_return, xirr}
    - funds: [...fund list...]
    - health_score: {...health score result...}
    - risk_profile: optional string
    - gap_analysis: optional dict
    """
    from engines.portfolio_scorecard import generate_portfolio_scorecard

    pdf_bytes = generate_portfolio_scorecard(
        investor=data.get("investor", {}),
        summary=data.get("summary", {}),
        funds=data.get("funds", []),
        health_score=data.get("health_score", {}),
        risk_profile=data.get("risk_profile"),
        gap_analysis=data.get("gap_analysis"),
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=MeraSIP-Portfolio-Scorecard.pdf"
        },
    )
