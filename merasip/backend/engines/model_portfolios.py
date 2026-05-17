"""MeraSIP Model Portfolios — category-level allocation templates by risk profile.

Maps each risk profile to a target asset allocation with equity/debt sub-splits.
Provides gap analysis between a client's actual holdings and the target model.

Trustner Asset Services (ARN-286886) — MFD. All outputs are category-level
guidance; no specific fund recommendations are made.
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any, Optional


# =============================================================================
# MODEL PORTFOLIO DEFINITIONS
# =============================================================================

_MODELS: dict[str, dict[str, Any]] = {
    "Conservative": {
        "name": "Conservative",
        "score_range": "10-30",
        "description": (
            "Capital-preservation focused. Heavy debt allocation with limited "
            "equity exposure for inflation protection."
        ),
        "allocation": {"equity": 30, "debt": 60, "gold": 10},
        "equity_split": {
            "Large Cap": 70,
            "Flexi Cap": 30,
        },
        "debt_split": {
            "Short Duration": 40,
            "Corporate Bond": 30,
            "Liquid": 30,
        },
    },
    "Moderate": {
        "name": "Moderate",
        "score_range": "31-50",
        "description": (
            "Balanced growth and stability. Equal emphasis on equity and debt "
            "for steady, inflation-beating returns."
        ),
        "allocation": {"equity": 50, "debt": 40, "gold": 10},
        "equity_split": {
            "Large Cap": 40,
            "Flexi Cap": 30,
            "Mid Cap": 20,
            "ELSS": 10,
        },
        "debt_split": {
            "Short Duration": 50,
            "Corporate Bond": 50,
        },
    },
    "Aggressive": {
        "name": "Aggressive",
        "score_range": "51-70",
        "description": (
            "Growth-oriented with a long horizon. Equity-heavy allocation "
            "diversified across market-cap categories."
        ),
        "allocation": {"equity": 70, "debt": 20, "gold": 10},
        "equity_split": {
            "Large Cap": 30,
            "Flexi Cap": 25,
            "Mid Cap": 25,
            "Small Cap": 10,
            "ELSS": 10,
        },
        "debt_split": {
            "Short Duration": 50,
            "Corporate Bond": 50,
        },
    },
    "Very Aggressive": {
        "name": "Very Aggressive",
        "score_range": "71-100",
        "description": (
            "Maximum growth portfolio for investors with high risk tolerance "
            "and a 10+ year horizon. Near-full equity with broad market-cap "
            "and thematic diversification."
        ),
        "allocation": {"equity": 85, "debt": 10, "gold": 5},
        "equity_split": {
            "Flexi Cap": 30,
            "Mid Cap": 25,
            "Small Cap": 20,
            "Large Cap": 15,
            "Sectoral / Thematic": 10,
        },
        "debt_split": {
            "Liquid": 100,
        },
    },
    "Retirement Income": {
        "name": "Retirement Income",
        "score_range": "special",
        "description": (
            "Income-focused portfolio suitable for retirees who need regular "
            "cash flow via SWP. Emphasises stability with moderate equity "
            "for longevity protection."
        ),
        "allocation": {"equity": 30, "debt": 50, "gold": 10, "hybrid": 10},
        "equity_split": {
            "Large Cap": 50,
            "Balanced Advantage": 50,
        },
        "debt_split": {
            "Short Duration": 40,
            "Corporate Bond": 30,
            "Liquid": 30,
        },
    },
}


# =============================================================================
# FUND CLASSIFICATION HELPER
# =============================================================================

_EQUITY_KEYWORDS = [
    "large cap", "largecap", "mid cap", "midcap", "small cap", "smallcap",
    "flexi cap", "flexicap", "multi cap", "multicap", "elss", "tax sav",
    "focused", "value", "contra", "large & mid", "dividend yield",
    "sectoral", "thematic", "banking", "pharma", "technology", "infra",
    "consumption", "manufacturing", "innovation", "digital", "healthcare",
    "energy", "defence", "defense", "psu", "index", "nifty", "sensex",
    "etf",
]

_DEBT_KEYWORDS = [
    "liquid", "overnight", "money market", "ultra short", "low duration",
    "short duration", "medium duration", "long duration", "gilt",
    "corporate bond", "credit risk", "dynamic bond", "floating rate",
    "banking & psu", "debt",
]

_HYBRID_KEYWORDS = [
    "balanced advantage", "aggressive hybrid", "conservative hybrid",
    "equity & debt", "equity hybrid", "debt hybrid", "equity savings",
    "multi asset", "asset allocator",
]

_GOLD_KEYWORDS = ["gold", "silver", "precious metal"]


def _classify_fund_type(fund_name: str, category: Optional[str] = None) -> str:
    """Classify a fund as equity / debt / gold / hybrid / other.

    Uses fund name and optional category string to determine the broad
    asset class.
    """
    text = f"{fund_name} {category or ''}".lower()

    if any(kw in text for kw in _GOLD_KEYWORDS):
        return "gold"
    if any(kw in text for kw in _HYBRID_KEYWORDS):
        return "hybrid"
    if any(kw in text for kw in _DEBT_KEYWORDS):
        return "debt"
    if any(kw in text for kw in _EQUITY_KEYWORDS):
        return "equity"

    # Heuristic fallback
    if re.search(r'\b(growth|fund)\b', text):
        return "equity"

    return "other"


# =============================================================================
# PUBLIC API
# =============================================================================

def get_model_portfolios() -> dict[str, dict[str, Any]]:
    """Return all five model portfolio templates.

    Returns:
        dict keyed by profile name → model definition.
    """
    return {name: dict(model) for name, model in _MODELS.items()}


def get_model_for_profile(profile: str) -> dict[str, Any]:
    """Return the model portfolio matching a given risk profile name.

    Args:
        profile: One of Conservative, Moderate, Aggressive, Very Aggressive,
                 or Retirement Income.

    Returns:
        The full model dict (allocation, equity_split, debt_split, etc.).

    Raises:
        ValueError: if the profile name is not recognised.
    """
    model = _MODELS.get(profile)
    if model is None:
        valid = ", ".join(_MODELS.keys())
        raise ValueError(
            f"Unknown risk profile '{profile}'. Valid profiles: {valid}"
        )
    return dict(model)


def calculate_gap_analysis(
    actual_funds: list[dict[str, Any]],
    target_model: dict[str, Any],
) -> dict[str, Any]:
    """Compare a client's actual fund holdings against a target model portfolio.

    Args:
        actual_funds: List of fund dicts from cas_parser.py output.
        target_model: A model portfolio dict (from get_model_for_profile).

    Returns:
        {
            "current_allocation": {
                "equity": float, "debt": float, "gold": float,
                "hybrid": float, "other": float
            },
            "target_allocation": dict,
            "gaps": [
                {
                    "category": str,
                    "current_pct": float,
                    "target_pct": float,
                    "gap_pct": float,
                    "action": "Increase" | "Decrease" | "On Track",
                },
            ],
            "rebalancing_actions": [str],
        }
    """
    total_value = sum(f.get("value", 0) for f in actual_funds) or 1

    # Build actual allocation percentages
    type_values: dict[str, float] = defaultdict(float)
    for f in actual_funds:
        ftype = _classify_fund_type(f.get("name", ""), f.get("category"))
        type_values[ftype] += f.get("value", 0)

    current_allocation = {
        "equity": round(type_values.get("equity", 0) / total_value * 100, 1),
        "debt": round(type_values.get("debt", 0) / total_value * 100, 1),
        "gold": round(type_values.get("gold", 0) / total_value * 100, 1),
        "hybrid": round(type_values.get("hybrid", 0) / total_value * 100, 1),
        "other": round(type_values.get("other", 0) / total_value * 100, 1),
    }

    # Target allocation from model
    target_alloc = dict(target_model.get("allocation", {}))

    # Calculate gaps for each asset class present in either actual or target
    all_categories = sorted(
        set(list(current_allocation.keys()) + list(target_alloc.keys()))
    )
    gaps: list[dict[str, Any]] = []
    rebalancing_actions: list[str] = []

    # Category → suggested fund type for human-readable rebalancing tips
    _CATEGORY_SUGGESTIONS: dict[str, str] = {
        "equity": "diversified equity funds (Large Cap, Flexi Cap, Mid Cap)",
        "debt": "debt funds (Short Duration, Corporate Bond)",
        "gold": "Gold funds",
        "hybrid": "Hybrid / Balanced Advantage funds",
    }

    for cat in all_categories:
        current_pct = current_allocation.get(cat, 0.0)
        target_pct = float(target_alloc.get(cat, 0.0))
        gap_pct = round(target_pct - current_pct, 1)

        # Determine action
        threshold = 3.0  # % tolerance band
        if gap_pct > threshold:
            action = "Increase"
        elif gap_pct < -threshold:
            action = "Decrease"
        else:
            action = "On Track"

        gaps.append({
            "category": cat.title(),
            "current_pct": current_pct,
            "target_pct": target_pct,
            "gap_pct": gap_pct,
            "action": action,
        })

        # Build rebalancing action string
        if action == "Increase" and cat in _CATEGORY_SUGGESTIONS:
            rebalancing_actions.append(
                f"Increase {cat.title()} allocation by ~{abs(gap_pct):.0f}% "
                f"— consider {_CATEGORY_SUGGESTIONS[cat]}."
            )
        elif action == "Decrease" and cat in _CATEGORY_SUGGESTIONS:
            rebalancing_actions.append(
                f"Reduce {cat.title()} allocation by ~{abs(gap_pct):.0f}% "
                f"— review overweight positions and rebalance."
            )

    return {
        "current_allocation": current_allocation,
        "target_allocation": target_alloc,
        "gaps": gaps,
        "rebalancing_actions": rebalancing_actions,
    }
