"""Business Entry Router — Log, edit, and view monthly business entries."""

import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from models.schemas import BusinessEntryCreate, BusinessEntryUpdate, SIPTrackerCreate, SIPStatusUpdate
from routers.auth import verify_token, get_supabase

router = APIRouter()


def _require_auth(user: dict = Depends(verify_token)) -> dict:
    return user


def _require_admin(user: dict = Depends(verify_token)) -> dict:
    role = (user.get("app_metadata") or {}).get("role", "employee")
    if role not in ("admin", "manager"):
        raise HTTPException(403, "Admin or manager access required")
    return user


def _resolve_employee_id(db, user: dict) -> str:
    """Resolve employee ID from auth_id, fallback to app_metadata.employee_id, then to id lookup."""
    # 1. Try by auth_id (normal Supabase login)
    try:
        emp_res = db.table("employees").select("id").eq("auth_id", user["sub"]).execute()
        if emp_res.data:
            return emp_res.data[0]["id"]
    except Exception:
        pass  # auth_id might not be a valid UUID
    # 2. Fallback: check app_metadata.employee_id (dev-preview or admin)
    emp_id = (user.get("app_metadata") or {}).get("employee_id")
    if emp_id:
        try:
            emp_res = db.table("employees").select("id").eq("id", emp_id).execute()
            if emp_res.data:
                return emp_res.data[0]["id"]
        except Exception:
            pass
    return ""


# ─── Business Entries ─────────────────────────────────────────────────────

@router.get("/my-month")
async def get_my_business(month: str, user: dict = Depends(_require_auth)):
    """Get current user's business entries for a month. Month format: YYYY-MM-DD."""
    db = get_supabase()
    emp_id = _resolve_employee_id(db, user)
    if not emp_id:
        raise HTTPException(404, "Employee profile not found")

    res = (
        db.table("monthly_business")
        .select("*, products(product_name, product_category, tier, credit_pct), channels(channel_name, channel_type, payout_pct)")
        .eq("employee_id", emp_id)
        .eq("month", month)
        .order("created_at", desc=True)
        .execute()
    )
    return {"entries": res.data or [], "employee_id": emp_id, "month": month}


@router.get("/team-month")
async def get_team_business(month: str, user: dict = Depends(_require_admin)):
    """Get team business entries (manager sees direct reports)."""
    db = get_supabase()
    mgr_id = _resolve_employee_id(db, user)
    if not mgr_id:
        raise HTTPException(404, "Employee profile not found")

    # Get direct reports
    team_res = db.table("employees").select("id, name").eq("reporting_manager_id", mgr_id).execute()
    team_ids = [e["id"] for e in (team_res.data or [])]
    team_ids.append(mgr_id)  # Include self

    res = (
        db.table("monthly_business")
        .select("*, products(product_name, product_category, tier), channels(channel_name)")
        .in_("employee_id", team_ids)
        .eq("month", month)
        .order("created_at", desc=True)
        .execute()
    )

    # Group by employee
    by_emp = {}
    for entry in (res.data or []):
        eid = entry["employee_id"]
        if eid not in by_emp:
            by_emp[eid] = []
        by_emp[eid].append(entry)

    return {
        "month": month,
        "team": [{"employee_id": e["id"], "name": e["name"]} for e in (team_res.data or [])],
        "entries_by_employee": by_emp,
    }


@router.post("/entry")
async def create_business_entry(data: BusinessEntryCreate, user: dict = Depends(_require_auth)):
    """Log a new business entry."""
    db = get_supabase()

    # Check month not locked
    lock_res = db.table("admin_controls").select("control_value").eq("control_key", "incentive_lock").execute()
    if lock_res.data and lock_res.data[0]["control_value"] == "true":
        raise HTTPException(423, "Month is locked for edits")

    # Verify product exists
    prod_res = db.table("products").select("*").eq("id", data.product_id).execute()
    if not prod_res.data:
        raise HTTPException(404, "Product not found")
    product = prod_res.data[0]

    # Get channel info if provided
    channel_payout = 0
    if data.channel_id:
        ch_res = db.table("channels").select("*").eq("id", data.channel_id).execute()
        if ch_res.data:
            channel_payout = float(ch_res.data[0].get("payout_pct", 0))

    # Pre-calculate weighted amount
    from engines.incentive_engine import calculate_weighted_amount
    calc = calculate_weighted_amount(
        raw_amount=data.raw_amount,
        product_credit_pct=float(product["credit_pct"]),
        channel_payout_pct=channel_payout,
        tier=int(product["tier"]),
        is_fp_route=data.is_fp_route,
    )

    record = {
        "employee_id": data.employee_id,
        "month": data.month,
        "product_id": data.product_id,
        "channel_id": data.channel_id,
        "raw_amount": data.raw_amount,
        "product_credit_pct": calc["product_credit_pct"],
        "channel_payout_pct": calc["channel_payout_pct"],
        "company_margin_pct": calc["company_margin_pct"],
        "tier_multiplier": calc["tier_multiplier"],
        "weighted_amount": calc["weighted_amount"],
        "is_fp_route": data.is_fp_route,
        "fp_maker_checker_status": "pending" if data.is_fp_route else None,
        "policy_number": data.policy_number,
        "client_name": data.client_name,
        "client_pan": data.client_pan,
        "insurer": data.insurer,
        "entry_source": data.entry_source,
        "created_by": data.employee_id,
    }

    res = db.table("monthly_business").insert(record).execute()

    # Audit log
    db.table("incentive_audit_log").insert({
        "action": "business_entry_created",
        "table_name": "monthly_business",
        "record_id": res.data[0]["id"] if res.data else None,
        "new_value": record,
    }).execute()

    return {"entry": res.data[0] if res.data else record, "calculation": calc}


@router.put("/entry/{entry_id}")
async def update_business_entry(entry_id: str, data: BusinessEntryUpdate, user: dict = Depends(_require_auth)):
    """Edit a business entry (before month lock)."""
    db = get_supabase()

    lock_res = db.table("admin_controls").select("control_value").eq("control_key", "incentive_lock").execute()
    if lock_res.data and lock_res.data[0]["control_value"] == "true":
        raise HTTPException(423, "Month is locked for edits")

    # Get existing entry
    existing = db.table("monthly_business").select("*").eq("id", entry_id).execute()
    if not existing.data:
        raise HTTPException(404, "Entry not found")
    old = existing.data[0]

    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(400, "No fields to update")

    # If raw_amount or channel changed, recalculate weighted
    if "raw_amount" in update_data or "channel_id" in update_data:
        prod_res = db.table("products").select("*").eq("id", old["product_id"]).execute()
        product = prod_res.data[0] if prod_res.data else {}

        channel_payout = 0
        ch_id = update_data.get("channel_id", old.get("channel_id"))
        if ch_id:
            ch_res = db.table("channels").select("payout_pct").eq("id", ch_id).execute()
            if ch_res.data:
                channel_payout = float(ch_res.data[0].get("payout_pct", 0))

        from engines.incentive_engine import calculate_weighted_amount
        calc = calculate_weighted_amount(
            raw_amount=update_data.get("raw_amount", old["raw_amount"]),
            product_credit_pct=float(product.get("credit_pct", 100)),
            channel_payout_pct=channel_payout,
            tier=int(product.get("tier", 1)),
            is_fp_route=update_data.get("is_fp_route", old.get("is_fp_route", False)),
        )
        update_data["weighted_amount"] = calc["weighted_amount"]
        update_data["product_credit_pct"] = calc["product_credit_pct"]
        update_data["channel_payout_pct"] = calc["channel_payout_pct"]
        update_data["company_margin_pct"] = calc["company_margin_pct"]
        update_data["tier_multiplier"] = calc["tier_multiplier"]

    res = db.table("monthly_business").update(update_data).eq("id", entry_id).execute()

    db.table("incentive_audit_log").insert({
        "action": "business_entry_updated",
        "table_name": "monthly_business",
        "record_id": entry_id,
        "old_value": old,
        "new_value": update_data,
    }).execute()

    return {"entry": res.data[0] if res.data else update_data}


@router.delete("/entry/{entry_id}")
async def delete_business_entry(entry_id: str, user: dict = Depends(_require_admin)):
    """Delete a business entry (admin only, with audit)."""
    db = get_supabase()

    existing = db.table("monthly_business").select("*").eq("id", entry_id).execute()
    if not existing.data:
        raise HTTPException(404, "Entry not found")

    db.table("monthly_business").delete().eq("id", entry_id).execute()

    db.table("incentive_audit_log").insert({
        "action": "business_entry_deleted",
        "table_name": "monthly_business",
        "record_id": entry_id,
        "old_value": existing.data[0],
    }).execute()

    return {"deleted": True}


# ─── SIP Tracker ──────────────────────────────────────────────────────────

@router.get("/sips")
async def get_sips(employee_id: str = None, user: dict = Depends(_require_auth)):
    """Get SIP tracker entries."""
    db = get_supabase()
    query = db.table("sip_tracker").select("*")
    if employee_id:
        query = query.eq("employee_id", employee_id)
    query = query.order("created_at", desc=True)
    res = query.execute()
    return {"sips": res.data or []}


@router.post("/sips")
async def create_sip(data: SIPTrackerCreate, user: dict = Depends(_require_auth)):
    """Create a new SIP tracking entry."""
    db = get_supabase()
    record = data.model_dump()
    res = db.table("sip_tracker").insert(record).execute()
    return {"sip": res.data[0] if res.data else record}


@router.patch("/sips/{sip_id}")
async def update_sip_status(sip_id: str, data: SIPStatusUpdate, user: dict = Depends(_require_auth)):
    """Update SIP status (stop/redeem triggers clawback)."""
    db = get_supabase()

    existing = db.table("sip_tracker").select("*").eq("id", sip_id).execute()
    if not existing.data:
        raise HTTPException(404, "SIP not found")
    sip = existing.data[0]

    update = {"sip_status": data.sip_status}
    if data.sip_status in ("Stopped", "Redeemed"):
        update["stopped_date"] = data.stopped_date or datetime.utcnow().date().isoformat()
        # Apply clawback for the current month
        current_month_res = db.table("admin_controls").select("control_value").eq("control_key", "current_month").execute()
        current_month = "2026-04-01"
        if current_month_res.data:
            cm = current_month_res.data[0]["control_value"]
            current_month = f"{cm}-01"
        update["clawback_applied_month"] = current_month
        update["clawback_amount"] = float(sip.get("sip_amount", 0))

    res = db.table("sip_tracker").update(update).eq("id", sip_id).execute()

    db.table("incentive_audit_log").insert({
        "action": "sip_status_changed",
        "table_name": "sip_tracker",
        "record_id": sip_id,
        "old_value": {"status": sip.get("sip_status")},
        "new_value": update,
    }).execute()

    return {"sip": res.data[0] if res.data else update}


# ─── Products & Channels (read-only for non-admin) ────────────────────────

@router.get("/products")
async def list_products(user: dict = Depends(_require_auth)):
    """List all products."""
    db = get_supabase()
    res = db.table("products").select("*").order("tier").execute()
    return {"products": res.data or []}


@router.get("/channels")
async def list_channels(user: dict = Depends(_require_auth)):
    """List all channels."""
    db = get_supabase()
    res = db.table("channels").select("*").order("channel_type").execute()
    return {"channels": res.data or []}
