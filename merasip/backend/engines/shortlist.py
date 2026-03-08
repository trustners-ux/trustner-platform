"""MeraSIP Fund Shortlist & Auto-Rebalancing Logic — March 2026."""

from typing import Optional
import re
from datetime import datetime

# =============================================================================
# MERASIP RECOMMENDED FUND SHORTLIST (Updated March 2026)
# =============================================================================

MERASIP_SHORTLIST = {
    "Large Cap": [
        {"rank": 1, "name": "Nippon India Large Cap Fund"},
        {"rank": 2, "name": "ICICI Pru Large Cap Fund"},
        {"rank": 3, "name": "WhiteOak Large Cap Fund"},
    ],
    "Large & Mid Cap": [
        {"rank": 1, "name": "ICICI Pru Large & Mid Cap Fund", "5y_return": 20.2},
        {"rank": 2, "name": "HDFC Large & Mid Cap Fund"},
    ],
    "Mid Cap": [
        {"rank": 1, "name": "HDFC Mid Cap Opportunities Fund", "3y_return": 22.8, "aum_cr": 92187},
        {"rank": 2, "name": "Motilal Oswal Midcap Fund"},
        {"rank": 3, "name": "Nippon India Growth Fund"},
    ],
    "Small Cap": [
        {"rank": 1, "name": "Mirae Asset Small Cap Fund"},
        {"rank": 2, "name": "Nippon India Small Cap Fund"},
    ],
    "Flexi Cap": [
        {"rank": 1, "name": "HDFC Flexi Cap Fund", "5y_return": 20.5},
        {"rank": 2, "name": "Parag Parikh Flexi Cap Fund"},
        {"rank": 3, "name": "Franklin India Flexi Cap Fund"},
    ],
    "Multi Cap": [
        {"rank": 1, "name": "Kotak Multicap Fund", "3y_return": 24.6},
        {"rank": 2, "name": "Nippon India Multi Cap Fund"},
        {"rank": 3, "name": "ICICI Pru Multicap Fund"},
    ],
    "Aggressive Hybrid": [
        {"rank": 1, "name": "ICICI Pru Equity & Debt Fund", "5y_return": 18.9},
        {"rank": 2, "name": "SBI Equity Hybrid Fund"},
    ],
    "Balanced Advantage": [
        {"rank": 1, "name": "HDFC Balanced Advantage Fund"},
        {"rank": 2, "name": "ICICI Pru Balanced Advantage Fund"},
    ],
    "FOF / Multi Asset": [
        {"rank": 1, "name": "Nippon India Multi-Asset Omni FoF"},
        {"rank": 2, "name": "ICICI Pru Asset Allocator FoF"},
    ],
}

# Flatten shortlist for quick lookups
_SHORTLIST_LOOKUP = {}
for category, funds in MERASIP_SHORTLIST.items():
    for fund in funds:
        # Normalize name for matching
        key = _normalize_name(fund["name"]) if callable(globals().get('_normalize_name')) else fund["name"].lower().strip()
        _SHORTLIST_LOOKUP[key] = {**fund, "category": category}


def _normalize_name(name: str) -> str:
    """Normalize fund name for fuzzy matching."""
    name = name.lower().strip()
    # Remove common suffixes
    name = re.sub(r'\s*-?\s*(regular|direct)\s*(plan|growth|idcw|dividend)?\s*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*-?\s*(growth|idcw|dividend)\s*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+', ' ', name)
    return name.strip()


# Rebuild lookup with proper normalization
_SHORTLIST_LOOKUP = {}
for category, funds in MERASIP_SHORTLIST.items():
    for fund in funds:
        key = _normalize_name(fund["name"])
        _SHORTLIST_LOOKUP[key] = {**fund, "category": category}


def is_in_shortlist(fund_name: str) -> Optional[dict]:
    """Check if a fund is in the MeraSIP shortlist. Returns shortlist entry or None."""
    normalized = _normalize_name(fund_name)

    # Exact match
    if normalized in _SHORTLIST_LOOKUP:
        return _SHORTLIST_LOOKUP[normalized]

    # Fuzzy match: check if shortlist fund name is contained in the fund name
    for key, entry in _SHORTLIST_LOOKUP.items():
        if key in normalized or normalized in key:
            return entry
        # Also check core name (without "Fund" suffix)
        core = key.replace(" fund", "")
        if core in normalized:
            return entry

    return None


def get_category_rank1(category: str) -> Optional[str]:
    """Get the Rank #1 fund for a given category."""
    funds = MERASIP_SHORTLIST.get(category, [])
    for f in funds:
        if f["rank"] == 1:
            return f["name"]
    return None


SECTORAL_KEYWORDS = [
    "sectoral", "thematic", "banking", "pharma", "technology", "infra",
    "consumption", "manufacturing", "innovation", "digital", "healthcare",
    "energy", "commodities", "business cycle", "defence", "psu",
]


def _is_sectoral(fund_name: str) -> bool:
    """Check if fund is sectoral/thematic."""
    name_lower = fund_name.lower()
    return any(kw in name_lower for kw in SECTORAL_KEYWORDS)


def _estimate_holding_months(since: Optional[str]) -> Optional[int]:
    """Estimate holding period in months from 'since' field (e.g., '2019', '2023')."""
    if not since:
        return None
    try:
        year = int(since)
        now = datetime.now()
        return (now.year - year) * 12 + now.month
    except (ValueError, TypeError):
        return None


def apply_rebalancing_logic(funds: list, portfolio_total: float = 0) -> list:
    """
    Apply MeraSIP rebalancing rules to a list of funds.

    Rules:
    1. abs_return < -10% AND holding < 18 months → SWITCH to category Rank #1
    2. Fund NOT in shortlist → REVIEW
    3. Fund in shortlist Rank #1-2 with positive XIRR → HOLD
    4. Sectoral/Thematic > 10% of portfolio → REVIEW
    5. More than 2 funds in same category → REVIEW underperformer
    6. ELSS fund, investor on New Tax Regime → alert in analysis

    Returns the same funds list with 'action' and 'analysis' fields populated.
    """
    if portfolio_total <= 0:
        portfolio_total = sum(f.get("value", 0) or f.get("val", 0) for f in funds) or 1

    # Count funds per category
    category_counts = {}
    for f in funds:
        cat = f.get("category") or f.get("cat") or ""
        if cat:
            category_counts.setdefault(cat, []).append(f)

    for fund in funds:
        fund_name = fund.get("name", "")
        abs_ret = fund.get("abs_return") or fund.get("abs")
        xirr = fund.get("xirr")
        value = fund.get("value") or fund.get("val") or 0
        invested = fund.get("invested") or fund.get("inv") or 0
        since = fund.get("since")
        category = fund.get("category") or fund.get("cat") or ""
        lock_in = fund.get("lock_in", False)

        holding_months = _estimate_holding_months(since)
        shortlist_entry = is_in_shortlist(fund_name)
        weight_pct = (value / portfolio_total * 100) if portfolio_total > 0 else 0

        action = None
        analysis_parts = []

        # Rule 1: Deep loss + recent entry → SWITCH
        if abs_ret is not None and abs_ret < -10 and holding_months is not None and holding_months < 18:
            action = "SWITCH"
            target = get_category_rank1(category) if category else None
            if target:
                fund["action_detail"] = target
                analysis_parts.append(
                    f"Underperforming at {abs_ret:.1f}% in <18 months. "
                    f"Recommend switching to {target}."
                )
            else:
                analysis_parts.append(
                    f"Underperforming at {abs_ret:.1f}% in <18 months. Review and consider switching."
                )

        # Rule 3: In shortlist Rank #1-2 with positive returns → HOLD
        elif shortlist_entry and shortlist_entry["rank"] <= 2:
            if (xirr is not None and xirr > 0) or (abs_ret is not None and abs_ret > 0):
                action = "HOLD"
                analysis_parts.append(
                    f"MeraSIP Shortlist Rank #{shortlist_entry['rank']} in {shortlist_entry['category']}. "
                    f"Strong performer — continue holding."
                )
            else:
                action = "HOLD"
                analysis_parts.append(
                    f"MeraSIP Shortlist fund. Returns currently subdued but long-term outlook positive."
                )

        # Rule 2: Not in shortlist → REVIEW
        elif not shortlist_entry:
            action = "REVIEW"
            analysis_parts.append(
                f"Not in MeraSIP recommended shortlist. Review allocation and consider consolidation."
            )

        # Default for shortlist Rank 3 or unmatched
        else:
            action = "HOLD"
            analysis_parts.append(
                f"In MeraSIP Shortlist (Rank #{shortlist_entry['rank']}). Acceptable holding."
            )

        # Rule 4: Sectoral/Thematic > 10% of portfolio → REVIEW
        if _is_sectoral(fund_name) and weight_pct > 10:
            action = "REVIEW"
            analysis_parts.append(
                f"Sectoral/thematic fund at {weight_pct:.1f}% of portfolio (>10% threshold). "
                f"Consider reducing allocation."
            )

        # Rule 5: Category duplication
        if category and category in category_counts and len(category_counts[category]) > 2:
            cat_funds = category_counts[category]
            # Find the worst performer in this category
            cat_returns = [(f.get("abs_return") or f.get("abs") or 0, f.get("name", "")) for f in cat_funds]
            cat_returns.sort(key=lambda x: x[0])
            worst_name = cat_returns[0][1]
            if fund_name == worst_name:
                action = "REVIEW"
                analysis_parts.append(
                    f"Multiple funds in {category} category. "
                    f"This is the underperformer — consider consolidating."
                )

        # Rule 6: ELSS + potential New Tax Regime
        if lock_in or re.search(r'ELSS|Tax Sav', fund_name, re.IGNORECASE):
            analysis_parts.append(
                "ELSS fund with 3-year lock-in. Note: No 80C benefit under New Tax Regime."
            )

        # Add return context
        if abs_ret is not None:
            if abs_ret > 50:
                analysis_parts.append(f"Excellent return of {abs_ret:.1f}%.")
            elif abs_ret > 20:
                analysis_parts.append(f"Good return of {abs_ret:.1f}%.")
            elif abs_ret < -5:
                analysis_parts.append(f"Currently in loss at {abs_ret:.1f}%.")

        # Set final values
        fund["action"] = action or "HOLD"
        fund["analysis"] = " ".join(analysis_parts) if analysis_parts else None

    return funds
