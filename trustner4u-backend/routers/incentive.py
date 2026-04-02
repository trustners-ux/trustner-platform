"""Incentive Calculation Router — Trigger calculations, view results, manage overrides."""

import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client

from models.schemas import IncentiveCalcRequest, IncentiveOverride
from routers.auth import verify_token, get_supabase
from engines.incentive_engine import calculate_employee_incentive, calculate_all_incentives

router = APIRouter()


def _resolve_employee_id(db, user: dict) -> str:
    """Resolve employee ID from auth_id, fallback to app_metadata.employee_id."""
    try:
        emp_res = db.table("employees").select("id").eq("auth_id", user["sub"]).execute()
        if emp_res.data:
            return emp_res.data[0]["id"]
    except Exception:
        pass  # auth_id might not be a valid UUID
    emp_id = (user.get("app_metadata") or {}).get("employee_id")
    if emp_id:
        try:
            emp_res = db.table("employees").select("id").eq("id", emp_id).execute()
            if emp_res.data:
                return emp_res.data[0]["id"]
        except Exception:
            pass
    return ""


def _require_auth(user: dict = Depends(verify_token)) -> dict:
    return user


def _require_admin(user: dict = Depends(verify_token)) -> dict:
    role = (user.get("app_metadata") or {}).get("role", "employee")
    if role not in ("admin",):
        raise HTTPException(403, "Admin access required")
    return user


def _require_manager(user: dict = Depends(verify_token)) -> dict:
    role = (user.get("app_metadata") or {}).get("role", "employee")
    if role not in ("admin", "manager"):
        raise HTTPException(403, "Manager access required")
    return user


# ─── Calculation Triggers ─────────────────────────────────────────────────

@router.post("/calculate")
async def trigger_calculation(data: IncentiveCalcRequest, user: dict = Depends(_require_admin)):
    """Trigger monthly incentive calculation (admin only)."""
    db = get_supabase()
    month_str = f"{data.month}-01"  # YYYY-MM -> YYYY-MM-DD
    result = await calculate_all_incentives(db, month_str, data.employee_ids)

    if "error" in result:
        raise HTTPException(423, result.get("message", "Calculation error"))

    # Audit log
    db.table("incentive_audit_log").insert({
        "action": "incentive_calculation_triggered",
        "table_name": "monthly_incentive_calc",
        "new_value": {
            "month": month_str,
            "employees_calculated": result["employees_calculated"],
            "total_payout": result["total_company_payout"],
        },
        "performed_by": None,
    }).execute()

    return result


# ─── My Incentive (Employee View) ────────────────────────────────────────

@router.get("/my-current")
async def get_my_current_incentive(user: dict = Depends(_require_auth)):
    """Get logged-in user's incentive for the current month (real-time estimate)."""
    db = get_supabase()

    # Find employee
    emp_id = _resolve_employee_id(db, user)
    if not emp_id:
        raise HTTPException(404, "Employee profile not found")

    # Get current month
    cm_res = db.table("admin_controls").select("control_value").eq("control_key", "current_month").execute()
    current_month = "2026-04-01"
    if cm_res.data:
        current_month = f"{cm_res.data[0]['control_value']}-01"

    # Calculate live
    result = await calculate_employee_incentive(db, emp_id, current_month)
    return result


@router.get("/my-history")
async def get_my_incentive_history(user: dict = Depends(_require_auth)):
    """Get logged-in user's incentive history (all months)."""
    db = get_supabase()

    emp_id = _resolve_employee_id(db, user)
    if not emp_id:
        raise HTTPException(404, "Employee profile not found")

    res = (
        db.table("monthly_incentive_calc")
        .select("*")
        .eq("employee_id", emp_id)
        .order("month", desc=True)
        .execute()
    )
    return {"history": res.data or []}


# ─── Team & Company Views ────────────────────────────────────────────────

@router.get("/team")
async def get_team_incentive(month: str, user: dict = Depends(_require_manager)):
    """Get team incentive summary (manager sees aggregate + individual performance)."""
    db = get_supabase()

    mgr_id = _resolve_employee_id(db, user)
    if not mgr_id:
        raise HTTPException(404, "Employee profile not found")

    # Get direct reports
    team_res = db.table("employees").select("id, name, designation, segment").eq("reporting_manager_id", mgr_id).execute()
    team_ids = [e["id"] for e in (team_res.data or [])]

    month_str = f"{month}-01"

    # Get calculations
    calc_res = (
        db.table("monthly_incentive_calc")
        .select("employee_id, monthly_target, net_weighted_business, achievement_pct, slab_label, net_incentive, total_payout, performance_status")
        .in_("employee_id", team_ids)
        .eq("month", month_str)
        .execute()
    )

    # Map employee names
    emp_map = {e["id"]: e for e in (team_res.data or [])}
    team_data = []
    for calc in (calc_res.data or []):
        emp_info = emp_map.get(calc["employee_id"], {})
        team_data.append({
            "employee_id": calc["employee_id"],
            "name": emp_info.get("name", ""),
            "designation": emp_info.get("designation", ""),
            "achievement_pct": calc.get("achievement_pct", 0),
            "performance_status": calc.get("performance_status", ""),
            "net_weighted_business": calc.get("net_weighted_business", 0),
            "monthly_target": calc.get("monthly_target", 0),
            "slab_label": calc.get("slab_label", ""),
        })

    # Aggregate
    total_business = sum(c.get("net_weighted_business", 0) for c in (calc_res.data or []))
    total_target = sum(c.get("monthly_target", 0) for c in (calc_res.data or []))
    team_achievement = (total_business / total_target * 100) if total_target > 0 else 0

    return {
        "month": month,
        "team_size": len(team_ids),
        "team_achievement_pct": round(team_achievement, 2),
        "total_team_business": total_business,
        "total_team_target": total_target,
        "members": team_data,
    }


@router.get("/company")
async def get_company_incentive(month: str, user: dict = Depends(_require_admin)):
    """Company-wide incentive summary (admin only)."""
    db = get_supabase()
    month_str = f"{month}-01"

    calc_res = (
        db.table("monthly_incentive_calc")
        .select("*")
        .eq("month", month_str)
        .execute()
    )
    calcs = calc_res.data or []

    total_raw = sum(c.get("total_raw_business", 0) for c in calcs)
    total_weighted = sum(c.get("net_weighted_business", 0) for c in calcs)
    total_payout = sum(c.get("total_payout", 0) for c in calcs)
    total_target = sum(c.get("monthly_target", 0) for c in calcs)

    # Group by performance status
    status_counts = {}
    for c in calcs:
        ps = c.get("performance_status", "Unknown")
        status_counts[ps] = status_counts.get(ps, 0) + 1

    return {
        "month": month,
        "employees_count": len(calcs),
        "total_raw_business": total_raw,
        "total_weighted_business": total_weighted,
        "total_target": total_target,
        "company_achievement_pct": round(total_weighted / total_target * 100, 2) if total_target > 0 else 0,
        "total_payout": total_payout,
        "performance_distribution": status_counts,
        "calculations": calcs,
    }


# ─── Slab Preview ────────────────────────────────────────────────────────

@router.get("/slab-preview")
async def slab_preview(achievement: float, segment: str = "Direct Sales", user: dict = Depends(_require_auth)):
    """Preview: What slab am I in at X% achievement?"""
    db = get_supabase()
    from engines.incentive_engine import determine_slab, get_applicable_slab_table

    slabs_res = db.table("incentive_slabs").select("*").execute()
    slab_table = get_applicable_slab_table(segment)
    slab = determine_slab(achievement, slab_table, slabs_res.data or [])

    return {
        "achievement_pct": achievement,
        "segment": segment,
        "slab_table": slab_table,
        **slab,
    }


# ─── Override (Super Admin) ──────────────────────────────────────────────

@router.post("/override")
async def override_incentive(data: IncentiveOverride, user: dict = Depends(_require_admin)):
    """Manual override of a specific incentive field (Super Admin + audit log)."""
    db = get_supabase()
    month_str = f"{data.month}-01"

    # Get existing calculation
    existing = (
        db.table("monthly_incentive_calc")
        .select("*")
        .eq("employee_id", data.employee_id)
        .eq("month", month_str)
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "No calculation found for this employee/month")

    old_record = existing.data[0]
    old_value = old_record.get(data.field)

    # Update the field
    update = {
        data.field: data.new_value,
        "approval_status": "admin_override",
    }

    # Recalculate total_payout if incentive fields changed
    incentive_fields = {"net_incentive", "trail_income", "recruitment_bonus", "activation_bonus", "motor_incentive", "referral_credit_amount"}
    if data.field in incentive_fields:
        new_record = {**old_record, **update}
        total = sum(float(new_record.get(f, 0) or 0) for f in incentive_fields)
        update["total_payout"] = total

    db.table("monthly_incentive_calc").update(update).eq("id", old_record["id"]).execute()

    # Audit
    db.table("incentive_audit_log").insert({
        "action": "incentive_override",
        "table_name": "monthly_incentive_calc",
        "record_id": old_record["id"],
        "old_value": {data.field: old_value},
        "new_value": {data.field: data.new_value},
        "reason": data.reason,
    }).execute()

    return {"overridden": True, "field": data.field, "old_value": old_value, "new_value": data.new_value}


# ─── Month Management ────────────────────────────────────────────────────

@router.post("/lock")
async def lock_month(month: str, user: dict = Depends(_require_admin)):
    """Lock a month (prevent edits to business entries)."""
    db = get_supabase()
    db.table("admin_controls").update({
        "control_value": "true",
        "last_modified_at": datetime.utcnow().isoformat(),
    }).eq("control_key", "incentive_lock").execute()

    db.table("incentive_audit_log").insert({
        "action": "month_locked",
        "new_value": {"month": month},
    }).execute()

    return {"locked": True, "month": month}


@router.post("/unlock")
async def unlock_month(month: str, user: dict = Depends(_require_admin)):
    """Unlock a month (allow edits again)."""
    db = get_supabase()
    db.table("admin_controls").update({
        "control_value": "false",
        "last_modified_at": datetime.utcnow().isoformat(),
    }).eq("control_key", "incentive_lock").execute()

    db.table("incentive_audit_log").insert({
        "action": "month_unlocked",
        "new_value": {"month": month},
    }).execute()

    return {"locked": False, "month": month}


# ─── Dashboard Data ──────────────────────────────────────────────────────

@router.get("/dashboard/employee")
async def employee_dashboard(user: dict = Depends(_require_auth)):
    """RM's personal dashboard data — everything they need at a glance."""
    db = get_supabase()

    # Find employee
    emp_id = _resolve_employee_id(db, user)
    if not emp_id:
        raise HTTPException(404, "Employee profile not found")
    emp_res = db.table("employees").select("*").eq("id", emp_id).execute()
    emp = emp_res.data[0]

    # Current month
    cm_res = db.table("admin_controls").select("control_value").eq("control_key", "current_month").execute()
    current_month = "2026-04"
    if cm_res.data:
        current_month = cm_res.data[0]["control_value"]
    month_str = f"{current_month}-01"

    # Get business entries
    biz_res = (
        db.table("monthly_business")
        .select("*, products(product_name, product_category, tier, credit_pct)")
        .eq("employee_id", emp_id)
        .eq("month", month_str)
        .order("created_at", desc=True)
        .execute()
    )
    entries = biz_res.data or []

    # Get or calculate incentive
    calc_res = (
        db.table("monthly_incentive_calc")
        .select("*")
        .eq("employee_id", emp_id)
        .eq("month", month_str)
        .execute()
    )
    incentive = calc_res.data[0] if calc_res.data else None

    # If no saved calculation, calculate live
    if not incentive:
        try:
            incentive = await calculate_employee_incentive(db, emp_id, month_str)
        except Exception:
            incentive = None

    # SIP health
    sip_res = db.table("sip_tracker").select("*").eq("employee_id", emp_id).execute()
    sips = sip_res.data or []
    active_sips = [s for s in sips if s.get("sip_status") == "Active"]
    stopped_this_month = [s for s in sips if s.get("clawback_applied_month") == month_str]

    # Get slabs for reference
    slabs_res = db.table("incentive_slabs").select("*").execute()

    return {
        "employee": {
            "id": emp_id,
            "name": emp.get("name"),
            "designation": emp.get("designation"),
            "segment": emp.get("segment"),
            "level_code": emp.get("level_code"),
            "gross_salary": emp.get("gross_salary"),
            "monthly_target": emp.get("monthly_target"),
        },
        "current_month": current_month,
        "entries": entries,
        "incentive": incentive,
        "sip_health": {
            "active_count": len(active_sips),
            "total_active_amount": sum(float(s.get("sip_amount", 0)) for s in active_sips),
            "stopped_this_month": len(stopped_this_month),
            "clawback_this_month": sum(float(s.get("clawback_amount", 0)) for s in stopped_this_month),
        },
        "slabs": slabs_res.data or [],
    }
