"""
Trustner Incentive Calculation Engine
=====================================
Implements the 10-step weighted business calculation per the spec:

Step 1: Raw Business Entry
Step 2: Apply Product Credit %
Step 3: Apply SIP Clawback
Step 4: Apply Channel Margin Credit (for non-direct business)
Step 5: Apply Tier Multiplier
Step 6: Sum all product lines → Total Weighted Business
Step 7: Calculate Achievement %
Step 8: Determine Slab (DST or POSP RM)
Step 9: Calculate Incentive
Step 10: Apply Compliance Multiplier
"""

import json
import logging
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from supabase import Client

logger = logging.getLogger(__name__)


def d(val) -> Decimal:
    """Convert to Decimal safely."""
    if val is None:
        return Decimal("0")
    return Decimal(str(val))


def calculate_weighted_amount(
    raw_amount: float,
    product_credit_pct: float,
    channel_payout_pct: float,
    tier: int,
    is_fp_route: bool = False,
    is_self_business_cdm: bool = False,
) -> dict:
    """
    Steps 2-5: Calculate the weighted business amount for a single entry.

    Returns a dict with all intermediate values for auditability.
    """
    raw = d(raw_amount)

    # Step 2: Apply Product Credit %
    credit_pct = d(product_credit_pct)
    if is_fp_route:
        credit_pct = Decimal("125")  # FP Route always gets 125%
    credited = raw * credit_pct / Decimal("100")

    # Step 4: Apply Channel Margin Credit
    payout = d(channel_payout_pct)
    margin_pct = Decimal("100") - payout
    if is_self_business_cdm:
        margin_pct = Decimal("300")  # CDM self-business gets 300% credit
    margin_credit = credited * margin_pct / Decimal("100")

    # Step 5: Apply Tier Multiplier
    tier_mult_map = {1: Decimal("1.0"), 2: Decimal("0.75"), 3: Decimal("0.50")}
    tier_mult = tier_mult_map.get(tier, Decimal("1.0"))
    weighted = margin_credit * tier_mult

    return {
        "raw_amount": float(raw),
        "product_credit_pct": float(credit_pct),
        "credited_amount": float(credited),
        "channel_payout_pct": float(payout),
        "company_margin_pct": float(margin_pct),
        "margin_credit": float(margin_credit),
        "tier": tier,
        "tier_multiplier": float(tier_mult),
        "weighted_amount": float(weighted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
    }


def determine_slab(achievement_pct: float, slab_table: str, slabs: list[dict]) -> dict:
    """
    Step 8: Look up achievement % in the applicable slab table.

    Returns the matching slab with incentive_rate and multiplier.
    """
    filtered = [s for s in slabs if s["slab_table_name"] == slab_table]
    filtered.sort(key=lambda x: x["achievement_min"])

    for slab in filtered:
        a_min = float(slab["achievement_min"])
        a_max = float(slab["achievement_max"]) if slab.get("achievement_max") else 9999
        if a_min <= achievement_pct <= a_max:
            return {
                "slab_label": slab.get("slab_label", ""),
                "incentive_rate": float(slab["incentive_rate"]),
                "multiplier": float(slab["multiplier"]),
                "achievement_min": a_min,
                "achievement_max": a_max,
            }

    # If achievement exceeds highest slab, use the highest slab
    if filtered and achievement_pct > float(filtered[-1].get("achievement_max", 0)):
        top_slab = filtered[-1]
        return {
            "slab_label": top_slab.get("slab_label", ""),
            "incentive_rate": float(top_slab["incentive_rate"]),
            "multiplier": float(top_slab["multiplier"]),
            "achievement_min": float(top_slab["achievement_min"]),
            "achievement_max": float(top_slab["achievement_max"]),
        }

    # Below minimum threshold
    return {
        "slab_label": "No Incentive",
        "incentive_rate": 0,
        "multiplier": 0,
        "achievement_min": 0,
        "achievement_max": 80,
    }


def determine_performance_status(achievement_pct: float) -> str:
    """Map achievement % to a performance label."""
    if achievement_pct >= 151:
        return "Star"
    elif achievement_pct >= 131:
        return "Champion"
    elif achievement_pct >= 111:
        return "Super"
    elif achievement_pct >= 100:
        return "Achiever"
    elif achievement_pct >= 80:
        return "Below Target"
    return "No Incentive"


def get_applicable_slab_table(segment: str) -> str:
    """Determine which slab table applies based on employee segment."""
    if segment in ("Direct Sales", "FP Team"):
        return "DST"
    elif segment in ("CDM/POSP RM", "Area Manager"):
        return "POSP_RM"
    return "DST"  # Default


async def calculate_employee_incentive(
    db: Client,
    employee_id: str,
    month_str: str,  # YYYY-MM-DD first of month
) -> dict:
    """
    Full 10-step incentive calculation for a single employee for a given month.

    Returns the complete calculation result dict.
    """
    # Fetch employee data
    emp_res = db.table("employees").select("*").eq("id", employee_id).single().execute()
    emp = emp_res.data
    if not emp:
        raise ValueError(f"Employee {employee_id} not found")

    segment = emp.get("segment", "Direct Sales")
    gross_salary = float(emp.get("gross_salary", 0))
    monthly_target = float(emp.get("monthly_target", 0))

    # If target not set on employee, calculate from segment config
    if monthly_target <= 0:
        tc_res = db.table("target_config").select("*").eq("segment", segment).execute()
        if tc_res.data:
            tc = tc_res.data[0]
            multiplier = float(tc["multiplier"])
            monthly_target = gross_salary * multiplier

    if monthly_target <= 0:
        logger.warning(f"Employee {employee_id} has no target. Writing zero row.")
        zero_record = {
            "employee_id": employee_id,
            "month": month_str,
            "monthly_target": 0,
            "total_raw_business": 0,
            "total_weighted_business": 0,
            "sip_clawback_debit": 0,
            "net_weighted_business": 0,
            "achievement_pct": 0,
            "applicable_slab": get_applicable_slab_table(segment),
            "slab_label": "No Incentive",
            "incentive_rate": 0,
            "slab_multiplier": 0,
            "gross_incentive": 0,
            "compliance_factor": 1.0,
            "net_incentive": 0,
            "trail_income": 0,
            "recruitment_bonus": 0,
            "activation_bonus": 0,
            "motor_incentive": 0,
            "referral_credit_amount": 0,
            "total_payout": 0,
            "cost_justified": True,
            "performance_status": "No Incentive",
            "calculation_timestamp": datetime.utcnow().isoformat(),
            "approval_status": "system_calculated",
            "calculation_details": json.dumps({"entries": [], "reason": "no_target"}),
        }
        db.table("monthly_incentive_calc").upsert(
            zero_record, on_conflict="employee_id,month"
        ).execute()
        return {"error": "no_target", "employee_id": employee_id, **zero_record}

    # Fetch all business entries for this employee/month
    biz_res = (
        db.table("monthly_business")
        .select("*, products(*), channels(*)")
        .eq("employee_id", employee_id)
        .eq("month", month_str)
        .execute()
    )
    entries = biz_res.data or []

    # Fetch incentive slabs
    slabs_res = db.table("incentive_slabs").select("*").execute()
    slabs = slabs_res.data or []

    # Step 1-5: Calculate weighted amount for each entry
    total_raw = Decimal("0")
    total_weighted = Decimal("0")
    entry_details = []

    for entry in entries:
        product = entry.get("products") or {}
        channel = entry.get("channels")
        raw_amt = float(entry.get("raw_amount", 0))

        product_credit = float(entry.get("product_credit_pct") or product.get("credit_pct", 100))
        channel_payout = float(entry.get("channel_payout_pct", 0))
        if channel:
            channel_payout = float(channel.get("payout_pct", 0))

        tier = int(product.get("tier", 1))
        is_fp = entry.get("is_fp_route", False)

        calc = calculate_weighted_amount(
            raw_amount=raw_amt,
            product_credit_pct=product_credit,
            channel_payout_pct=channel_payout,
            tier=tier,
            is_fp_route=is_fp,
        )

        total_raw += d(raw_amt)
        total_weighted += d(calc["weighted_amount"])

        entry_details.append({
            "entry_id": entry["id"],
            "product_name": product.get("product_name", "Unknown"),
            "client_name": entry.get("client_name", ""),
            **calc,
        })

        # Update the entry row with calculated values
        db.table("monthly_business").update({
            "product_credit_pct": calc["product_credit_pct"],
            "channel_payout_pct": calc["channel_payout_pct"],
            "company_margin_pct": calc["company_margin_pct"],
            "tier_multiplier": calc["tier_multiplier"],
            "weighted_amount": calc["weighted_amount"],
        }).eq("id", entry["id"]).execute()

    # Step 3: Apply SIP Clawback
    sip_res = (
        db.table("sip_tracker")
        .select("*")
        .eq("employee_id", employee_id)
        .eq("clawback_applied_month", month_str)
        .execute()
    )
    sip_clawback = Decimal("0")
    for sip in (sip_res.data or []):
        sip_clawback += d(sip.get("clawback_amount", 0))

    # Step 6: Net Weighted Business
    net_weighted = total_weighted - sip_clawback
    if net_weighted < 0:
        net_weighted = Decimal("0")

    # Step 7: Calculate Achievement %
    target = d(monthly_target)
    achievement_pct = float(
        (net_weighted / target * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    ) if target > 0 else 0

    # Step 8: Determine Slab
    slab_table = get_applicable_slab_table(segment)
    slab = determine_slab(achievement_pct, slab_table, slabs)

    # Step 9: Calculate Incentive
    incentive_rate = d(slab["incentive_rate"])
    slab_multiplier = d(slab["multiplier"])
    gross_incentive = net_weighted * incentive_rate / Decimal("100") * slab_multiplier
    gross_incentive = gross_incentive.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Step 10: Apply Compliance Multiplier
    compliance_factor = Decimal("1.0")  # Default — balanced scorecard not yet active
    net_incentive = gross_incentive * compliance_factor
    net_incentive = net_incentive.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Trail income (Phase 2 — placeholder)
    trail_income = Decimal("0")

    # Total payout
    total_payout = net_incentive + trail_income
    total_payout = total_payout.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Cost justified check
    cost_justified = float(total_payout) <= gross_salary

    # Performance status
    perf_status = determine_performance_status(achievement_pct)

    # Distance to next slab
    next_slab_info = None
    if slab["incentive_rate"] > 0 and slab.get("achievement_max", 999) < 999:
        next_threshold = slab["achievement_max"] + 1
        amount_needed = (d(next_threshold) / Decimal("100") * target) - net_weighted
        if amount_needed > 0:
            next_slab_info = {
                "next_threshold_pct": float(next_threshold),
                "amount_needed": float(amount_needed.quantize(Decimal("0.01"))),
            }

    result = {
        "employee_id": employee_id,
        "employee_name": emp.get("name", ""),
        "month": month_str,
        "segment": segment,
        "gross_salary": gross_salary,
        "monthly_target": float(target),
        "total_raw_business": float(total_raw),
        "total_weighted_business": float(total_weighted),
        "sip_clawback_debit": float(sip_clawback),
        "net_weighted_business": float(net_weighted),
        "achievement_pct": achievement_pct,
        "applicable_slab": slab_table,
        "slab_label": slab["slab_label"],
        "incentive_rate": float(incentive_rate),
        "slab_multiplier": float(slab_multiplier),
        "gross_incentive": float(gross_incentive),
        "compliance_factor": float(compliance_factor),
        "net_incentive": float(net_incentive),
        "trail_income": float(trail_income),
        "recruitment_bonus": 0,
        "activation_bonus": 0,
        "motor_incentive": 0,
        "referral_credit_amount": 0,
        "total_payout": float(total_payout),
        "cost_justified": cost_justified,
        "performance_status": perf_status,
        "next_slab_info": next_slab_info,
        "entry_details": entry_details,
    }

    # Upsert into monthly_incentive_calc
    calc_record = {
        "employee_id": employee_id,
        "month": month_str,
        "monthly_target": float(target),
        "total_raw_business": float(total_raw),
        "total_weighted_business": float(total_weighted),
        "sip_clawback_debit": float(sip_clawback),
        "net_weighted_business": float(net_weighted),
        "achievement_pct": achievement_pct,
        "applicable_slab": slab_table,
        "slab_label": slab["slab_label"],
        "incentive_rate": float(incentive_rate),
        "slab_multiplier": float(slab_multiplier),
        "gross_incentive": float(gross_incentive),
        "compliance_factor": float(compliance_factor),
        "net_incentive": float(net_incentive),
        "trail_income": float(trail_income),
        "recruitment_bonus": 0,
        "activation_bonus": 0,
        "motor_incentive": 0,
        "referral_credit_amount": 0,
        "total_payout": float(total_payout),
        "cost_justified": cost_justified,
        "performance_status": perf_status,
        "calculation_timestamp": datetime.utcnow().isoformat(),
        "approval_status": "system_calculated",
        "calculation_details": json.dumps({"entries": entry_details, "next_slab": next_slab_info}),
    }

    db.table("monthly_incentive_calc").upsert(
        calc_record,
        on_conflict="employee_id,month",
    ).execute()

    return result


async def calculate_all_incentives(
    db: Client,
    month_str: str,
    employee_ids: Optional[list[str]] = None,
) -> dict:
    """
    Calculate incentives for all (or selected) active employees.

    Returns summary with individual results.
    """
    # Check if month is locked
    lock_res = db.table("admin_controls").select("control_value").eq("control_key", "incentive_lock").execute()
    if lock_res.data and lock_res.data[0]["control_value"] == "true":
        return {"error": "incentive_locked", "message": "Incentive calculations are locked by admin"}

    # Get employees
    query = db.table("employees").select("id, name, segment, is_active").eq("is_active", True)
    if employee_ids:
        query = query.in_("id", employee_ids)
    emp_res = query.execute()
    employees = emp_res.data or []

    results = []
    errors = []
    for emp in employees:
        # Skip support staff (no target-based incentive)
        if emp.get("segment") == "Support":
            continue
        try:
            # Always run for every active employee — even if they have zero
            # business entries for the month. calculate_employee_incentive
            # will upsert a zero row (achievement=0, slab='No Incentive',
            # performance_status='No Incentive') so stale rows are wiped out.
            r = await calculate_employee_incentive(db, emp["id"], month_str)
            results.append(r)
        except Exception as e:
            logger.error(f"Error calculating for {emp['id']}: {e}")
            errors.append({"employee_id": emp["id"], "name": emp.get("name"), "error": str(e)})
            # Best-effort: write a zero row so we never leave stale data.
            try:
                db.table("monthly_incentive_calc").upsert({
                    "employee_id": emp["id"],
                    "month": month_str,
                    "monthly_target": 0,
                    "total_raw_business": 0,
                    "total_weighted_business": 0,
                    "sip_clawback_debit": 0,
                    "net_weighted_business": 0,
                    "achievement_pct": 0,
                    "slab_label": "No Incentive",
                    "incentive_rate": 0,
                    "slab_multiplier": 0,
                    "gross_incentive": 0,
                    "compliance_factor": 1.0,
                    "net_incentive": 0,
                    "trail_income": 0,
                    "recruitment_bonus": 0,
                    "activation_bonus": 0,
                    "motor_incentive": 0,
                    "referral_credit_amount": 0,
                    "total_payout": 0,
                    "cost_justified": True,
                    "performance_status": "No Incentive",
                    "calculation_timestamp": datetime.utcnow().isoformat(),
                    "approval_status": "system_calculated",
                    "calculation_details": json.dumps({"error": str(e)}),
                }, on_conflict="employee_id,month").execute()
            except Exception:
                pass

    total_payout = sum(r.get("total_payout", 0) for r in results if "error" not in r)

    return {
        "month": month_str,
        "employees_calculated": len(results),
        "errors": errors,
        "total_company_payout": total_payout,
        "results": results,
    }
