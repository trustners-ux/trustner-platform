"""MeraSIP Risk Profiler — SEBI-compliant risk assessment questionnaire & scoring.

Generates a 10-question risk questionnaire, scores investor responses (0-100),
and maps to a risk profile with model asset-allocation guidance.

Trustner Asset Services (ARN-286886) — MFD. All outputs are category-level
guidance; no specific fund recommendations.
"""

from __future__ import annotations

from typing import Any


# =============================================================================
# QUESTION BANK (10 questions, each scored 2-10)
# =============================================================================

_QUESTIONS: list[dict[str, Any]] = [
    {
        "id": "age_group",
        "text": "What is your age group?",
        "options": [
            {"label": "Under 30", "weight": 10},
            {"label": "30-40", "weight": 8},
            {"label": "40-50", "weight": 6},
            {"label": "50-60", "weight": 4},
            {"label": "60+", "weight": 2},
        ],
    },
    {
        "id": "annual_income",
        "text": "What is your annual income?",
        "options": [
            {"label": "Below ₹5 Lakh", "weight": 2},
            {"label": "₹5-10 Lakh", "weight": 4},
            {"label": "₹10-25 Lakh", "weight": 6},
            {"label": "₹25-50 Lakh", "weight": 8},
            {"label": "Above ₹50 Lakh", "weight": 10},
        ],
    },
    {
        "id": "monthly_savings",
        "text": "What percentage of your monthly income do you save?",
        "options": [
            {"label": "Less than 10%", "weight": 2},
            {"label": "10-20%", "weight": 4},
            {"label": "20-30%", "weight": 6},
            {"label": "30-50%", "weight": 8},
            {"label": "Over 50%", "weight": 10},
        ],
    },
    {
        "id": "investment_horizon",
        "text": "What is your investment time horizon?",
        "options": [
            {"label": "Less than 1 year", "weight": 2},
            {"label": "1-3 years", "weight": 4},
            {"label": "3-5 years", "weight": 6},
            {"label": "5-10 years", "weight": 8},
            {"label": "More than 10 years", "weight": 10},
        ],
    },
    {
        "id": "investment_experience",
        "text": "How much experience do you have with mutual fund investing?",
        "options": [
            {"label": "None", "weight": 2},
            {"label": "Less than 2 years", "weight": 4},
            {"label": "2-5 years", "weight": 6},
            {"label": "5-10 years", "weight": 8},
            {"label": "More than 10 years", "weight": 10},
        ],
    },
    {
        "id": "market_drop_reaction",
        "text": "If the market drops 20% in a month, what would you do?",
        "options": [
            {"label": "Sell everything", "weight": 2},
            {"label": "Sell some investments", "weight": 4},
            {"label": "Do nothing — wait it out", "weight": 6},
            {"label": "Buy more at lower prices", "weight": 8},
            {"label": "Buy aggressively", "weight": 10},
        ],
    },
    {
        "id": "risk_return_preference",
        "text": "Which statement best describes your risk-return preference?",
        "options": [
            {"label": "I want zero risk, even if returns are low", "weight": 2},
            {"label": "I prefer low risk with moderate returns", "weight": 4},
            {"label": "I can accept moderate risk for good returns", "weight": 7},
            {"label": "I am willing to take high risk for high returns", "weight": 10},
        ],
    },
    {
        "id": "existing_liabilities",
        "text": "What portion of your monthly income goes towards EMIs and loans?",
        "options": [
            {"label": "More than 50%", "weight": 2},
            {"label": "30-50%", "weight": 4},
            {"label": "10-30%", "weight": 6},
            {"label": "Less than 10%", "weight": 8},
            {"label": "No liabilities", "weight": 10},
        ],
    },
    {
        "id": "emergency_fund",
        "text": "How many months of expenses do you have in an emergency fund?",
        "options": [
            {"label": "No emergency fund", "weight": 2},
            {"label": "Less than 3 months", "weight": 4},
            {"label": "3-6 months", "weight": 6},
            {"label": "6-12 months", "weight": 8},
            {"label": "More than 12 months", "weight": 10},
        ],
    },
    {
        "id": "primary_goal",
        "text": "What is your primary financial goal?",
        "options": [
            {"label": "Capital preservation — protect what I have", "weight": 2},
            {"label": "Regular income — steady cash flow", "weight": 4},
            {"label": "Balanced growth — grow steadily over time", "weight": 6},
            {"label": "Aggressive growth — maximise returns", "weight": 8},
            {"label": "Wealth creation — long-term compounding", "weight": 10},
        ],
    },
]

# Build a lookup {question_id → {weight_value → True}} for answer validation
_VALID_WEIGHTS: dict[str, set[int]] = {
    q["id"]: {opt["weight"] for opt in q["options"]} for q in _QUESTIONS
}


# =============================================================================
# PROFILE DEFINITIONS
# =============================================================================

_PROFILES: list[dict[str, Any]] = [
    {
        "name": "Conservative",
        "min_score": 10,
        "max_score": 30,
        "description": (
            "You prefer stability over high returns and are uncomfortable "
            "with short-term market fluctuations. A Conservative portfolio "
            "prioritises capital protection with a large debt allocation "
            "and limited equity exposure."
        ),
        "model_allocation": {"equity": 30, "debt": 60, "gold": 10},
    },
    {
        "name": "Moderate",
        "min_score": 31,
        "max_score": 50,
        "description": (
            "You seek a balance between growth and safety and can tolerate "
            "moderate market ups and downs. A Moderate portfolio blends "
            "equity and debt in roughly equal measure to target steady, "
            "inflation-beating returns."
        ),
        "model_allocation": {"equity": 50, "debt": 40, "gold": 10},
    },
    {
        "name": "Aggressive",
        "min_score": 51,
        "max_score": 70,
        "description": (
            "You are comfortable with market volatility and have a longer "
            "investment horizon. An Aggressive portfolio leans heavily into "
            "equity across market-cap categories while keeping a modest "
            "debt cushion."
        ),
        "model_allocation": {"equity": 70, "debt": 20, "gold": 10},
    },
    {
        "name": "Very Aggressive",
        "min_score": 71,
        "max_score": 100,
        "description": (
            "You have high risk tolerance, a long time horizon, and seek "
            "maximum capital appreciation. A Very Aggressive portfolio is "
            "almost entirely equity with broad market-cap diversification "
            "and minimal debt."
        ),
        "model_allocation": {"equity": 85, "debt": 10, "gold": 5},
    },
]


# =============================================================================
# PUBLIC API
# =============================================================================

def get_questions() -> list[dict[str, Any]]:
    """Return the full question bank for the frontend to render.

    Each question dict contains:
        id   — unique question identifier (used as key in answers)
        text — the question string
        options — list of {label, weight}
    """
    return _QUESTIONS


def calculate_risk_profile(answers: dict[str, int]) -> dict[str, Any]:
    """Score a set of answers and return the matching risk profile.

    Args:
        answers: mapping of question_id → selected weight value.
                 e.g. {"age_group": 8, "annual_income": 6, ...}

    Returns:
        {
            "score": int (10-100),
            "profile": str,
            "description": str,
            "model_allocation": {"equity": %, "debt": %, "gold": %},
        }

    Raises:
        ValueError: if a required question is missing or an invalid weight
                    is supplied.
    """
    _validate_answers(answers)

    total = sum(answers[q["id"]] for q in _QUESTIONS)

    # Clamp to valid range (defensive)
    total = max(10, min(100, total))

    for profile in _PROFILES:
        if profile["min_score"] <= total <= profile["max_score"]:
            return {
                "score": total,
                "profile": profile["name"],
                "description": profile["description"],
                "model_allocation": dict(profile["model_allocation"]),
            }

    # Fallback — should never trigger with correct scoring
    return {
        "score": total,
        "profile": _PROFILES[-1]["name"],
        "description": _PROFILES[-1]["description"],
        "model_allocation": dict(_PROFILES[-1]["model_allocation"]),
    }


# =============================================================================
# INTERNAL HELPERS
# =============================================================================

def _validate_answers(answers: dict[str, int]) -> None:
    """Ensure every question is answered and each weight is valid."""
    for q in _QUESTIONS:
        qid = q["id"]
        if qid not in answers:
            raise ValueError(f"Missing answer for question '{qid}'.")
        weight = answers[qid]
        if weight not in _VALID_WEIGHTS[qid]:
            valid = sorted(_VALID_WEIGHTS[qid])
            raise ValueError(
                f"Invalid weight {weight} for question '{qid}'. "
                f"Valid weights: {valid}"
            )
