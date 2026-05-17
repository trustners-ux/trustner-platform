"""Context-Aware AI Advisor — MFD-compliant portfolio guidance."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import httpx

router = APIRouter()


class AdvisorChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None  # portfolio, risk_profile, goals, health_score
    history: list[dict] = []  # [{role: "user"/"assistant", content: "..."}]


class AdvisorChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = []  # Quick reply suggestions


SYSTEM_PROMPT = """You are MeraSIP AI Advisor — a knowledgeable financial guide for Trustner Asset Services Pvt. Ltd. (ARN-286886), an AMFI-registered Mutual Fund Distributor.

CRITICAL RULES:
1. You are NOT an investment adviser (RIA). Never recommend specific fund names.
2. Always give category-level guidance: "consider Large Cap funds" not "buy HDFC Top 100"
3. You ARE an MFD — you support REGULAR plan mutual funds (not direct plans)
4. Position MFD value: behavioral coaching, hand-holding during crashes, goal planning
5. Never say "switch from regular to direct" or promote direct plans
6. Be conversational, warm, and in simple English (mix Hindi terms naturally: "SIP", "lakh", "crore")
7. If the client has portfolio data, reference their ACTUAL numbers
8. Keep responses concise — 3-5 short paragraphs max
9. End with a clear actionable next step or question
10. If asked about topics outside finance, politely redirect

CLIENT CONTEXT (if available):
{context}

Use this context to personalize every response. Reference their actual portfolio value, health score, risk profile, and goals when relevant.
"""


def _build_context_string(context: dict) -> str:
    """Build a readable context string from client data."""
    parts = []

    if context.get("risk_profile"):
        rp = context["risk_profile"]
        parts.append(
            f"Risk Profile: {rp.get('profile', 'Unknown')} (Score: {rp.get('score', '?')}/100)"
        )

    if context.get("portfolio"):
        p = context["portfolio"]
        summary = p.get("summary", {})
        parts.append(
            f"Portfolio: Invested ₹{summary.get('total_invested', 0) / 1e5:.1f}L, "
            f"Current ₹{summary.get('total_value', 0) / 1e5:.1f}L, "
            f"Return {summary.get('abs_return', 0):.1f}%"
        )
        funds = p.get("funds", [])
        parts.append(
            f"Funds: {len(funds)} funds across "
            f"{len(set(f.get('amc', '') for f in funds))} AMCs"
        )
        # Top 5 funds by value
        top = sorted(funds, key=lambda f: f.get("value", 0), reverse=True)[:5]
        fund_lines = [
            f"  - {f.get('name', '?')}: ₹{f.get('value', 0) / 1e5:.1f}L ({f.get('abs_return', 0):.1f}%)"
            for f in top
        ]
        parts.append("Top holdings:\n" + "\n".join(fund_lines))

    if context.get("health_score"):
        hs = context["health_score"]
        parts.append(
            f"Health Score: {hs.get('total_score', '?')}/100 (Grade: {hs.get('grade', '?')})"
        )
        dims = hs.get("dimensions", {})
        dim_lines = [
            f"  - {k}: {v.get('score', '?')}/{v.get('max', 20)}"
            for k, v in dims.items()
        ]
        parts.append("Dimensions:\n" + "\n".join(dim_lines))
        recs = hs.get("recommendations", [])
        if recs:
            parts.append("Recommendations: " + "; ".join(recs[:3]))

    if context.get("goals"):
        goals = context["goals"]
        goal_lines = [
            f"  - {g.get('name', '?')}: Target ₹{g.get('target_amount', 0) / 1e5:.1f}L by {g.get('target_date', '?')}"
            for g in goals[:5]
        ]
        parts.append("Goals:\n" + "\n".join(goal_lines))

    return "\n".join(parts) if parts else "No client data available — this is a general inquiry."


@router.post("/ai-advisor/chat", response_model=AdvisorChatResponse)
async def ai_advisor_chat(req: AdvisorChatRequest):
    """Context-aware AI advisor chat endpoint."""

    api_key = os.getenv("OPENAI_API_KEY")
    context_string = _build_context_string(req.context or {})
    system = SYSTEM_PROMPT.replace("{context}", context_string)

    # Build messages
    messages = [{"role": "system", "content": system}]
    for msg in req.history[-10:]:  # Last 10 messages for context
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": req.message})

    if not api_key:
        # Demo mode fallback
        reply = _demo_response(req.message, req.context or {})
        return AdvisorChatResponse(
            reply=reply, suggestions=_get_suggestions(req.context)
        )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "max_tokens": 800,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]

            return AdvisorChatResponse(
                reply=reply, suggestions=_get_suggestions(req.context)
            )
    except Exception:
        # Fallback to demo mode
        reply = _demo_response(req.message, req.context or {})
        return AdvisorChatResponse(
            reply=reply, suggestions=_get_suggestions(req.context)
        )


def _demo_response(message: str, context: dict) -> str:
    """Generate a contextual demo response without API."""
    msg_lower = message.lower()

    portfolio = context.get("portfolio", {})
    summary = portfolio.get("summary", {})
    risk = context.get("risk_profile", {})
    health = context.get("health_score", {})

    profile = risk.get("profile", "Moderate")
    score = health.get("total_score", 75)
    grade = health.get("grade", "B+")
    value = summary.get("total_value", 0)
    invested = summary.get("total_invested", 0)
    abs_return = summary.get("abs_return", 0)

    if any(w in msg_lower for w in ["health", "score", "how.*portfolio", "check"]):
        dims = health.get("dimensions", {})
        strong = (
            max(dims.items(), key=lambda x: x[1].get("score", 0))[0]
            if dims
            else "discipline"
        )
        weak = (
            min(dims.items(), key=lambda x: x[1].get("score", 0))[0]
            if dims
            else "diversification"
        )
        recs = health.get(
            "recommendations", ["Consider reviewing your portfolio allocation"]
        )
        return (
            f"Your portfolio health score is **{score}/100** (Grade: **{grade}**).\n\n"
            f"Your strongest area is **{strong.title()}**, while **{weak.title()}** could use some attention.\n\n"
            f"My top recommendation: {recs[0] if recs else 'Keep your SIPs running and review quarterly.'}\n\n"
            f"Would you like me to dig deeper into any specific dimension?"
        )

    elif any(w in msg_lower for w in ["goal", "retire", "education", "target"]):
        return (
            f"Based on your current portfolio of ₹{value / 1e5:.1f}L and your **{profile}** risk profile, "
            f"let's plan your goals.\n\n"
            f"To set up goal tracking, head to the **Goal Planner** (Goals tab in the navigation). "
            f"You can set targets for retirement, child education, house purchase, and more — "
            f"with live projections showing if you're on track.\n\n"
            f"Would you like help estimating how much SIP you need for a specific goal?"
        )

    elif any(
        w in msg_lower for w in ["rebalance", "allocation", "equity", "debt", "mix"]
    ):
        model = risk.get(
            "model_allocation", {"equity": 60, "debt": 30, "gold": 10}
        )
        return (
            f"Your **{profile}** risk profile suggests a target of **{model.get('equity', 60)}% equity / "
            f"{model.get('debt', 30)}% debt / {model.get('gold', 10)}% gold**.\n\n"
            f"Based on your CAS data, your current allocation may differ from this target. "
            f"Check the **Model Portfolios** page (Models tab) for a detailed gap analysis showing "
            f"exactly where to increase or decrease.\n\n"
            f"Remember — rebalancing once a year is usually sufficient. Don't over-trade!"
        )

    elif any(
        w in msg_lower for w in ["sip", "invest", "start", "begin", "how much"]
    ):
        return (
            f"Great question! With your **{profile}** risk profile, here's a simple framework:\n\n"
            f"1. **Emergency Fund first** — 6 months expenses in a Liquid fund\n"
            f"2. **Term Insurance** — 10x annual income\n"
            f"3. **Health Insurance** — ₹10-20L family floater\n"
            f"4. **Then SIP** — Start with what you can commit for 5+ years\n\n"
            f"Your current portfolio is ₹{value / 1e5:.1f}L. A good next step would be to "
            f"set a specific goal in the **Goal Planner** and see exactly how much monthly SIP you need.\n\n"
            f"Want me to walk you through setting up your first goal?"
        )

    else:
        status = (
            "in great shape"
            if score >= 80
            else (
                "doing well with room for improvement"
                if score >= 60
                else "in need of some attention"
            )
        )
        recs = health.get("recommendations", [])
        rec_text = recs[0] if recs else "Keep your SIPs running and review quarterly."
        return (
            f"Thanks for reaching out! I can see your portfolio — ₹{invested / 1e5:.1f}L invested, "
            f"currently at ₹{value / 1e5:.1f}L ({abs_return:.1f}% return).\n\n"
            f"With your **{profile}** risk profile (score: {risk.get('score', '?')}/100) and "
            f"health score of **{score}/100 ({grade})**, your portfolio is {status}.\n\n"
            f"{rec_text}\n\n"
            f"What would you like to explore? I can help with goal planning, rebalancing analysis, "
            f"or explaining any aspect of your portfolio."
        )


def _get_suggestions(context: dict) -> list[str]:
    """Return contextual quick-reply suggestions."""
    suggestions = []

    health = context.get("health_score", {}) if context else {}
    risk = context.get("risk_profile", {}) if context else {}
    portfolio = context.get("portfolio", {}) if context else {}

    if health:
        dims = health.get("dimensions", {})
        weak = (
            min(dims.items(), key=lambda x: x[1].get("score", 0)) if dims else None
        )
        if weak and weak[1].get("score", 20) < 15:
            suggestions.append(f"How do I improve my {weak[0]}?")

    if portfolio.get("funds"):
        suggestions.append("Which funds should I review?")

    if risk:
        suggestions.append("Am I well-allocated for my profile?")

    suggestions.append("How much SIP do I need for retirement?")
    suggestions.append("Explain my portfolio health score")

    return suggestions[:4]
