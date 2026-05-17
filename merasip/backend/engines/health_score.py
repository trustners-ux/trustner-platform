"""MeraSIP Portfolio Health Score Engine — rates a mutual fund portfolio 0-100.

Takes the parsed CAS fund list (from cas_parser.py) and scores the portfolio
across five dimensions: Diversification, Category Allocation, Fund Overlap,
Performance, and SIP Discipline.

Trustner Asset Services (ARN-286886) — MFD. All recommendations are
category-level guidance; no specific fund names are suggested.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Any, Optional


# =============================================================================
# CATEGORY CLASSIFICATION HELPERS
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

# Recognised equity sub-categories for overlap detection
_EQUITY_SUBCATEGORIES = {
    "large cap": ["large cap", "largecap", "large-cap", "bluechip", "blue chip"],
    "mid cap": ["mid cap", "midcap", "mid-cap"],
    "small cap": ["small cap", "smallcap", "small-cap"],
    "flexi cap": ["flexi cap", "flexicap"],
    "multi cap": ["multi cap", "multicap"],
    "elss": ["elss", "tax sav"],
    "large & mid cap": ["large & mid", "large and mid"],
    "focused": ["focused"],
    "value / contra": ["value", "contra"],
    "sectoral / thematic": [
        "sectoral", "thematic", "banking", "pharma", "technology", "infra",
        "consumption", "manufacturing", "innovation", "digital", "healthcare",
        "energy", "defence", "defense", "psu",
    ],
    "index / etf": ["index", "nifty", "sensex", "etf"],
}


def _classify_fund_type(fund_name: str, category: Optional[str] = None) -> str:
    """Classify a fund as equity / debt / gold / hybrid / other."""
    text = f"{fund_name} {category or ''}".lower()

    if any(kw in text for kw in _GOLD_KEYWORDS):
        return "gold"
    if any(kw in text for kw in _HYBRID_KEYWORDS):
        return "hybrid"
    if any(kw in text for kw in _DEBT_KEYWORDS):
        return "debt"
    if any(kw in text for kw in _EQUITY_KEYWORDS):
        return "equity"

    # Heuristic: if "fund" or "growth" in name and nothing else matched
    if re.search(r'\b(growth|fund)\b', text):
        return "equity"

    return "other"


def _equity_subcategory(fund_name: str, category: Optional[str] = None) -> str:
    """Return the equity sub-category for overlap detection."""
    text = f"{fund_name} {category or ''}".lower()
    for subcat, keywords in _EQUITY_SUBCATEGORIES.items():
        if any(kw in text for kw in keywords):
            return subcat
    return "uncategorised"


# =============================================================================
# FUND GROUPING HELPERS
# =============================================================================

def _categorize_funds(funds: list[dict[str, Any]]) -> dict[str, list[dict]]:
    """Group funds by their broad type (equity / debt / gold / hybrid / other)."""
    groups: dict[str, list[dict]] = defaultdict(list)
    for f in funds:
        ftype = _classify_fund_type(f.get("name", ""), f.get("category"))
        groups[ftype].append(f)
    return dict(groups)


def _detect_overlaps(funds: list[dict[str, Any]]) -> dict[str, list[dict]]:
    """Return equity sub-category → funds mapping for overlap analysis."""
    buckets: dict[str, list[dict]] = defaultdict(list)
    for f in funds:
        ftype = _classify_fund_type(f.get("name", ""), f.get("category"))
        if ftype == "equity":
            subcat = _equity_subcategory(f.get("name", ""), f.get("category"))
            buckets[subcat].append(f)
    return dict(buckets)


# =============================================================================
# DIMENSION SCORERS (each returns score 0-20 + list of issues)
# =============================================================================

def _score_diversification(funds: list[dict]) -> tuple[int, list[str]]:
    """Dimension 1 — AMC diversification and category spread."""
    issues: list[str] = []
    if not funds:
        return 0, ["No funds in portfolio."]

    total_value = sum(f.get("value", 0) for f in funds) or 1

    # Unique AMCs
    amcs = [f.get("amc") or "Unknown" for f in funds]
    unique_amcs = set(amcs)
    num_amcs = len(unique_amcs)

    if num_amcs <= 2:
        score = 5
        issues.append(f"Only {num_amcs} AMC(s) — consider adding funds from other fund houses.")
    elif num_amcs <= 4:
        score = 10
    elif num_amcs <= 6:
        score = 15
    else:
        score = 20

    # Penalise single-AMC concentration > 50%
    amc_values: dict[str, float] = defaultdict(float)
    for f in funds:
        amc_values[f.get("amc") or "Unknown"] += f.get("value", 0)
    for amc, val in amc_values.items():
        pct = val / total_value * 100
        if pct > 50:
            score = max(0, score - 5)
            issues.append(f"{amc} accounts for {pct:.0f}% of portfolio — consider diversifying.")
            break  # Only penalise once

    # Penalise < 3 fund categories
    categories = set()
    for f in funds:
        ftype = _classify_fund_type(f.get("name", ""), f.get("category"))
        categories.add(ftype)
    if len(categories) < 3:
        score = max(0, score - 5)
        issues.append(
            f"Portfolio covers only {len(categories)} asset type(s). "
            "Adding debt or hybrid funds would improve diversification."
        )

    return min(20, max(0, score)), issues


def _score_allocation(funds: list[dict], risk_profile: Optional[str] = None) -> tuple[int, list[str]]:
    """Dimension 2 — asset-class allocation quality."""
    issues: list[str] = []
    if not funds:
        return 0, ["No funds to evaluate."]

    total_value = sum(f.get("value", 0) for f in funds) or 1
    groups = _categorize_funds(funds)

    equity_val = sum(f.get("value", 0) for f in groups.get("equity", []))
    debt_val = sum(f.get("value", 0) for f in groups.get("debt", []))
    hybrid_val = sum(f.get("value", 0) for f in groups.get("hybrid", []))
    gold_val = sum(f.get("value", 0) for f in groups.get("gold", []))

    eq_pct = equity_val / total_value * 100
    debt_pct = debt_val / total_value * 100
    hybrid_pct = hybrid_val / total_value * 100

    # Good mix: equity 40-80% with meaningful debt/hybrid allocation
    has_debt = (debt_pct + hybrid_pct) >= 10
    has_equity = eq_pct >= 30

    if 40 <= eq_pct <= 80 and has_debt:
        score = 20
    elif 30 <= eq_pct <= 90 and has_debt:
        score = 15
    elif eq_pct > 90:
        score = 10
        issues.append(
            f"Portfolio is {eq_pct:.0f}% equity with negligible debt cushion. "
            "Consider adding debt funds to reduce volatility."
        )
    elif eq_pct < 30 and risk_profile not in ("Conservative", None):
        score = 10
        issues.append(
            f"Equity allocation is only {eq_pct:.0f}% — may be too conservative "
            "for your risk profile. Consider increasing equity exposure."
        )
    else:
        score = 12

    # Check equity sub-category spread
    equity_funds = groups.get("equity", [])
    if equity_funds:
        subcats = set()
        for f in equity_funds:
            subcats.add(_equity_subcategory(f.get("name", ""), f.get("category")))
        common_cats = {"large cap", "mid cap", "small cap", "flexi cap"}
        covered = subcats & common_cats
        if len(covered) >= 3:
            pass  # Good spread, no deduction
        elif len(covered) == 2:
            issues.append("Equity allocation covers limited market-cap segments.")
        elif len(covered) <= 1 and len(equity_funds) >= 3:
            score = max(0, score - 3)
            issues.append(
                "Equity exposure is concentrated in a single market-cap segment. "
                "Diversifying across large, mid, and flexi cap categories may help."
            )

    return min(20, max(0, score)), issues


def _score_overlap(funds: list[dict]) -> tuple[int, list[str]]:
    """Dimension 3 — detect overlapping fund categories."""
    issues: list[str] = []
    if not funds:
        return 0, ["No funds to evaluate."]

    score = 20
    overlaps = _detect_overlaps(funds)

    for subcat, subcat_funds in overlaps.items():
        count = len(subcat_funds)
        if count > 2:
            extra = count - 2
            penalty = extra * 5
            score -= penalty
            names = ", ".join(f.get("name", "?")[:35] for f in subcat_funds)
            issues.append(
                f"{count} funds in {subcat} category ({names}). "
                f"Consider consolidating to 1-2 funds."
            )

    return min(20, max(0, score)), issues


def _score_performance(funds: list[dict]) -> tuple[int, list[str]]:
    """Dimension 4 — portfolio return metrics."""
    issues: list[str] = []
    if not funds:
        return 0, ["No funds to evaluate."]

    # Weighted average absolute return
    total_value = sum(f.get("value", 0) for f in funds) or 1
    weighted_return = 0.0
    has_return_data = False

    for f in funds:
        abs_ret = f.get("abs_return")
        if abs_ret is not None:
            weight = f.get("value", 0) / total_value
            weighted_return += abs_ret * weight
            has_return_data = True

    if not has_return_data:
        return 10, ["Return data not available for all funds."]

    avg_ret = weighted_return

    if avg_ret < 0:
        score = 5
        issues.append(f"Portfolio is in overall loss ({avg_ret:.1f}%). Review underperformers.")
    elif avg_ret < 5:
        score = 8
        issues.append(f"Portfolio return of {avg_ret:.1f}% is below inflation. Review allocation.")
    elif avg_ret < 10:
        score = 12
    elif avg_ret < 15:
        score = 16
    else:
        score = 20

    # XIRR bonus
    xirr_values = [f.get("xirr") for f in funds if f.get("xirr") is not None]
    if xirr_values:
        avg_xirr = sum(xirr_values) / len(xirr_values)
        if avg_xirr > 12:
            score = min(20, score + 2)

    # Flag individual underperformers
    underperformers = [
        f for f in funds
        if f.get("abs_return") is not None and f["abs_return"] < -10
    ]
    if underperformers:
        issues.append(
            f"{len(underperformers)} fund(s) with more than 10% loss — "
            "review these for potential switch."
        )

    return min(20, max(0, score)), issues


def _score_discipline(funds: list[dict]) -> tuple[int, list[str]]:
    """Dimension 5 — plan type (Regular vs Direct) and fund count discipline."""
    issues: list[str] = []
    if not funds:
        return 0, ["No funds to evaluate."]

    score = 0
    total = len(funds)

    # Plan type scoring (MFD prefers Regular plan)
    regular_count = sum(
        1 for f in funds
        if (f.get("plan") or "").lower() == "regular"
    )
    direct_count = sum(
        1 for f in funds
        if (f.get("plan") or "").lower() == "direct"
    )

    if total > 0:
        regular_pct = regular_count / total * 100
    else:
        regular_pct = 0

    if regular_pct == 100:
        score = 20
    elif regular_pct >= 70:
        score = 15
    elif regular_pct >= 40:
        score = 12
        issues.append(
            f"{direct_count} of {total} funds are Direct plans. "
            "Working with an MFD advisor (Regular plan) provides ongoing "
            "portfolio review and rebalancing guidance."
        )
    else:
        score = 5
        issues.append(
            f"Most funds ({direct_count} of {total}) are in Direct plan. "
            "Regular plans through an MFD provide professional advisory "
            "support and periodic review."
        )

    # Fund count scoring
    if 5 <= total <= 8:
        score = min(20, score + 5)
    elif 8 < total <= 12:
        score = min(20, score + 3)
    elif total > 15:
        issues.append(
            f"Portfolio has {total} funds — consider consolidating to "
            "8-10 funds for easier tracking and lower overlap."
        )
    elif total < 4:
        issues.append(
            f"Only {total} fund(s) — a broader selection of 5-8 funds "
            "across categories may improve diversification."
        )

    return min(20, max(0, score)), issues


# =============================================================================
# GRADE CALCULATION
# =============================================================================

def _grade(total: int) -> str:
    """Map numeric score to letter grade."""
    if total >= 90:
        return "A+"
    if total >= 80:
        return "A"
    if total >= 70:
        return "B+"
    if total >= 60:
        return "B"
    if total >= 50:
        return "C"
    return "D"


# =============================================================================
# RECOMMENDATION & STRENGTH GENERATORS
# =============================================================================

def _build_recommendations(dimensions: dict[str, dict]) -> list[str]:
    """Pick the top 3-5 most impactful recommendations from dimension issues."""
    all_issues: list[str] = []
    # Prioritise dimensions with the lowest score-to-max ratio
    sorted_dims = sorted(
        dimensions.items(),
        key=lambda kv: kv[1]["score"] / max(kv[1]["max"], 1),
    )
    for _dim_name, dim_data in sorted_dims:
        for issue in dim_data["issues"]:
            if issue not in all_issues:
                all_issues.append(issue)
    return all_issues[:5]


def _build_strengths(dimensions: dict[str, dict], funds: list[dict]) -> list[str]:
    """Identify 2-3 portfolio strengths."""
    strengths: list[str] = []

    if dimensions["diversification"]["score"] >= 15:
        strengths.append("Good diversification across multiple AMCs and categories.")
    if dimensions["allocation"]["score"] >= 15:
        strengths.append("Well-balanced asset allocation across equity and debt.")
    if dimensions["overlap"]["score"] >= 18:
        strengths.append("Minimal fund overlap — each fund serves a distinct purpose.")
    if dimensions["performance"]["score"] >= 16:
        strengths.append("Strong overall portfolio returns.")
    if dimensions["discipline"]["score"] >= 18:
        strengths.append("Disciplined investment approach with advisor-guided Regular plans.")

    # Fallback if everything scored low
    if not strengths:
        total_value = sum(f.get("value", 0) for f in funds)
        if total_value > 0:
            strengths.append(
                "You have taken the first step by building a mutual fund portfolio. "
                "A few adjustments can significantly improve its health."
            )
        else:
            strengths.append("Portfolio uploaded successfully for analysis.")

    return strengths[:3]


# =============================================================================
# PUBLIC API
# =============================================================================

def calculate_health_score(
    funds: list[dict[str, Any]],
    risk_profile: Optional[str] = None,
) -> dict[str, Any]:
    """Calculate a comprehensive portfolio health score.

    Args:
        funds: List of fund dicts as returned by cas_parser.py. Each fund
               should have at minimum: name, amc, category, plan, invested,
               value, abs_return, xirr.
        risk_profile: Optional risk profile string (Conservative / Moderate /
                      Aggressive / Very Aggressive) to contextualise
                      allocation scoring.

    Returns:
        {
            "total_score": int (0-100),
            "grade": str (A+, A, B+, B, C, D),
            "dimensions": {
                "diversification": {"score": int, "max": 20, "issues": [str]},
                "allocation":      {"score": int, "max": 20, "issues": [str]},
                "overlap":         {"score": int, "max": 20, "issues": [str]},
                "performance":     {"score": int, "max": 20, "issues": [str]},
                "discipline":      {"score": int, "max": 20, "issues": [str]},
            },
            "recommendations": [str],
            "strengths": [str],
        }
    """
    div_score, div_issues = _score_diversification(funds)
    alloc_score, alloc_issues = _score_allocation(funds, risk_profile)
    overlap_score, overlap_issues = _score_overlap(funds)
    perf_score, perf_issues = _score_performance(funds)
    disc_score, disc_issues = _score_discipline(funds)

    dimensions = {
        "diversification": {"score": div_score, "max": 20, "issues": div_issues},
        "allocation": {"score": alloc_score, "max": 20, "issues": alloc_issues},
        "overlap": {"score": overlap_score, "max": 20, "issues": overlap_issues},
        "performance": {"score": perf_score, "max": 20, "issues": perf_issues},
        "discipline": {"score": disc_score, "max": 20, "issues": disc_issues},
    }

    total = div_score + alloc_score + overlap_score + perf_score + disc_score
    total = min(100, max(0, total))

    return {
        "total_score": total,
        "grade": _grade(total),
        "dimensions": dimensions,
        "recommendations": _build_recommendations(dimensions),
        "strengths": _build_strengths(dimensions, funds),
    }
