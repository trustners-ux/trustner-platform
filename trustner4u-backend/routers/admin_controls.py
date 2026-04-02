"""Admin Controls Router — Settings, slab management, audit log, and employee setup."""

import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client

from models.schemas import AdminControlUpdate
from routers.auth import verify_token, get_supabase

router = APIRouter()


def _require_admin(user: dict = Depends(verify_token)) -> dict:
    role = (user.get("app_metadata") or {}).get("role", "employee")
    if role not in ("admin",):
        raise HTTPException(403, "Admin access required")
    return user


# ─── Admin Controls ───────────────────────────────────────────────────────

@router.get("/controls")
async def get_controls(user: dict = Depends(_require_admin)):
    """Get all admin control settings."""
    db = get_supabase()
    res = db.table("admin_controls").select("*").order("control_key").execute()
    return {"controls": res.data or []}


@router.put("/controls/{key}")
async def update_control(key: str, data: AdminControlUpdate, user: dict = Depends(_require_admin)):
    """Update an admin control setting."""
    db = get_supabase()

    existing = db.table("admin_controls").select("*").eq("control_key", key).execute()
    if not existing.data:
        raise HTTPException(404, f"Control key '{key}' not found")

    old_value = existing.data[0]["control_value"]

    db.table("admin_controls").update({
        "control_value": data.control_value,
        "last_modified_at": datetime.utcnow().isoformat(),
    }).eq("control_key", key).execute()

    db.table("incentive_audit_log").insert({
        "action": "admin_control_updated",
        "table_name": "admin_controls",
        "old_value": {"key": key, "value": old_value},
        "new_value": {"key": key, "value": data.control_value},
        "reason": data.reason,
    }).execute()

    return {"updated": True, "key": key, "old_value": old_value, "new_value": data.control_value}


# ─── Incentive Slabs Management ──────────────────────────────────────────

@router.get("/slabs")
async def get_slabs(user: dict = Depends(_require_admin)):
    """Get all incentive slab tables."""
    db = get_supabase()
    res = db.table("incentive_slabs").select("*").order("slab_table_name").order("achievement_min").execute()
    return {"slabs": res.data or []}


@router.post("/slabs")
async def create_slab(slab: dict, user: dict = Depends(_require_admin)):
    """Create a new incentive slab entry."""
    db = get_supabase()
    res = db.table("incentive_slabs").insert(slab).execute()

    db.table("incentive_audit_log").insert({
        "action": "slab_created",
        "table_name": "incentive_slabs",
        "new_value": slab,
    }).execute()

    return {"slab": res.data[0] if res.data else slab}


@router.put("/slabs/{slab_id}")
async def update_slab(slab_id: str, slab: dict, user: dict = Depends(_require_admin)):
    """Update an incentive slab entry."""
    db = get_supabase()

    existing = db.table("incentive_slabs").select("*").eq("id", slab_id).execute()
    if not existing.data:
        raise HTTPException(404, "Slab not found")

    res = db.table("incentive_slabs").update(slab).eq("id", slab_id).execute()

    db.table("incentive_audit_log").insert({
        "action": "slab_updated",
        "table_name": "incentive_slabs",
        "record_id": slab_id,
        "old_value": existing.data[0],
        "new_value": slab,
    }).execute()

    return {"slab": res.data[0] if res.data else slab}


# ─── Product Management ──────────────────────────────────────────────────

@router.get("/products")
async def get_products(user: dict = Depends(_require_admin)):
    """Get all products with tier and credit info."""
    db = get_supabase()
    res = db.table("products").select("*").order("tier").order("product_category").execute()
    return {"products": res.data or []}


@router.post("/products")
async def create_product(product: dict, user: dict = Depends(_require_admin)):
    """Create a new product."""
    db = get_supabase()
    res = db.table("products").insert(product).execute()
    return {"product": res.data[0] if res.data else product}


@router.put("/products/{product_id}")
async def update_product(product_id: str, product: dict, user: dict = Depends(_require_admin)):
    """Update a product."""
    db = get_supabase()
    res = db.table("products").update(product).eq("id", product_id).execute()
    return {"product": res.data[0] if res.data else product}


# ─── Channel Management ──────────────────────────────────────────────────

@router.post("/channels")
async def create_channel(channel: dict, user: dict = Depends(_require_admin)):
    """Create a new channel/POSP."""
    db = get_supabase()
    res = db.table("channels").insert(channel).execute()
    return {"channel": res.data[0] if res.data else channel}


@router.put("/channels/{channel_id}")
async def update_channel(channel_id: str, channel: dict, user: dict = Depends(_require_admin)):
    """Update a channel."""
    db = get_supabase()
    res = db.table("channels").update(channel).eq("id", channel_id).execute()
    return {"channel": res.data[0] if res.data else channel}


# ─── Target Config ────────────────────────────────────────────────────────

@router.get("/targets")
async def get_targets(user: dict = Depends(_require_admin)):
    """Get target configuration by segment."""
    db = get_supabase()
    res = db.table("target_config").select("*").order("segment").execute()
    return {"targets": res.data or []}


@router.put("/targets/{target_id}")
async def update_target(target_id: str, target: dict, user: dict = Depends(_require_admin)):
    """Update target config for a segment."""
    db = get_supabase()

    existing = db.table("target_config").select("*").eq("id", target_id).execute()
    if not existing.data:
        raise HTTPException(404, "Target config not found")

    res = db.table("target_config").update(target).eq("id", target_id).execute()

    db.table("incentive_audit_log").insert({
        "action": "target_config_updated",
        "table_name": "target_config",
        "record_id": target_id,
        "old_value": existing.data[0],
        "new_value": target,
    }).execute()

    return {"target": res.data[0] if res.data else target}


# ─── Audit Log ────────────────────────────────────────────────────────────

@router.get("/audit-log")
async def get_audit_log(
    limit: int = 100,
    offset: int = 0,
    action: str = None,
    user: dict = Depends(_require_admin),
):
    """View audit trail."""
    db = get_supabase()
    query = db.table("incentive_audit_log").select("*").order("performed_at", desc=True)
    if action:
        query = query.eq("action", action)
    query = query.range(offset, offset + limit - 1)
    res = query.execute()
    return {"audit_log": res.data or [], "limit": limit, "offset": offset}


# ─── Employee Incentive Setup ─────────────────────────────────────────────

@router.put("/employee/{employee_id}/incentive-setup")
async def setup_employee_incentive(employee_id: str, setup: dict, user: dict = Depends(_require_admin)):
    """Set incentive-specific fields on an employee (level, segment, target, etc.)."""
    db = get_supabase()

    allowed_fields = {
        "employee_code", "gross_salary", "entity", "annual_ctc",
        "level_code", "segment", "reporting_manager_id", "location",
        "target_multiplier", "monthly_target", "annual_target",
        "tenure_years", "doj", "job_responsibility", "phone",
    }
    update_data = {k: v for k, v in setup.items() if k in allowed_fields}

    if not update_data:
        raise HTTPException(400, "No valid fields to update")

    # Auto-calculate targets if multiplier/salary changed
    if "target_multiplier" in update_data or "gross_salary" in update_data:
        emp_res = db.table("employees").select("gross_salary, target_multiplier").eq("id", employee_id).execute()
        emp = emp_res.data[0] if emp_res.data else {}
        salary = float(update_data.get("gross_salary", emp.get("gross_salary", 0)))
        mult = float(update_data.get("target_multiplier", emp.get("target_multiplier", 0)))
        update_data["monthly_target"] = salary * mult
        update_data["annual_target"] = salary * mult * 12

    res = db.table("employees").update(update_data).eq("id", employee_id).execute()

    db.table("incentive_audit_log").insert({
        "action": "employee_incentive_setup",
        "table_name": "employees",
        "record_id": employee_id,
        "new_value": update_data,
    }).execute()

    return {"updated": True, "employee_id": employee_id, "fields": update_data}


# ─── Schema Fix (Temporary) ──────────────────────────────────────────────

@router.post("/fix-schema")
async def fix_schema(user: dict = Depends(_require_admin)):
    """Add missing incentive columns to employees table and seed Ram Shah data."""
    import httpx

    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
    ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    # Step 1: ALTER TABLE to add missing columns
    alter_sql = """
    ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(15),
      ADD COLUMN IF NOT EXISTS doj DATE,
      ADD COLUMN IF NOT EXISTS job_responsibility TEXT,
      ADD COLUMN IF NOT EXISTS gross_salary DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS entity VARCHAR(10),
      ADD COLUMN IF NOT EXISTS annual_ctc DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS level_code VARCHAR(5),
      ADD COLUMN IF NOT EXISTS segment VARCHAR(50),
      ADD COLUMN IF NOT EXISTS reporting_manager_id UUID,
      ADD COLUMN IF NOT EXISTS location VARCHAR(50),
      ADD COLUMN IF NOT EXISTS target_multiplier DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS monthly_target DECIMAL(14,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS annual_target DECIMAL(14,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tenure_years DECIMAL(4,1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    """

    # Step 2: Seed Ram Shah + Sangeeta Shah + some key employees
    seed_sql = """
    UPDATE employees SET
      employee_code = 'TAS001', segment = 'Direct Sales', level_code = 'L1',
      gross_salary = 150000, monthly_target = 500000, annual_target = 6000000,
      entity = 'TAS', job_responsibility = 'Direct Sales', target_multiplier = 1.0,
      tenure_years = 5, is_active = true
    WHERE LOWER(name) LIKE '%ram%shah%';

    UPDATE employees SET
      employee_code = 'TAS002', segment = 'Direct Sales', level_code = 'L1',
      gross_salary = 150000, monthly_target = 500000, annual_target = 6000000,
      entity = 'TAS', job_responsibility = 'Direct Sales', target_multiplier = 1.0,
      tenure_years = 5, is_active = true
    WHERE LOWER(name) LIKE '%sangeeta%shah%';

    UPDATE employees SET
      segment = 'Direct Sales', level_code = 'L3', entity = 'TAS',
      gross_salary = 35000, monthly_target = 200000, annual_target = 2400000,
      job_responsibility = 'Direct Sales', target_multiplier = 0.8,
      tenure_years = 1, is_active = true
    WHERE segment IS NULL AND is_active IS NOT false;
    """

    results = []
    async with httpx.AsyncClient(timeout=60.0) as client:
        for label, sql in [("alter_table", alter_sql), ("seed_data", seed_sql)]:
            try:
                resp = await client.post(
                    f"https://{ref}.supabase.co/pg/query",
                    headers=headers,
                    json={"query": sql},
                )
                results.append({"step": label, "status": resp.status_code, "response": resp.text[:500]})
            except Exception as e:
                results.append({"step": label, "error": str(e)})

    return {"results": results}


# ─── Cost Analysis ────────────────────────────────────────────────────────

@router.get("/cost-analysis")
async def cost_analysis(month: str, user: dict = Depends(_require_admin)):
    """Company-wide CTI and cost analysis."""
    db = get_supabase()
    month_str = f"{month}-01"

    # Get all employees with salary
    emp_res = db.table("employees").select("id, name, gross_salary, segment, designation").eq("is_active", True).execute()
    employees = emp_res.data or []

    # Get calculations
    calc_res = db.table("monthly_incentive_calc").select("*").eq("month", month_str).execute()
    calcs = {c["employee_id"]: c for c in (calc_res.data or [])}

    total_salary = sum(float(e.get("gross_salary", 0)) for e in employees)
    total_incentive = sum(float(c.get("total_payout", 0)) for c in calcs.values())
    total_revenue = sum(float(c.get("total_raw_business", 0)) for c in calcs.values())

    total_cost = total_salary + total_incentive
    cti = (total_cost / total_revenue * 100) if total_revenue > 0 else 0

    cti_status = "Healthy" if cti < 40 else ("Warning" if cti < 60 else "Critical")

    return {
        "month": month,
        "total_employees": len(employees),
        "total_salary": total_salary,
        "total_incentive_payout": total_incentive,
        "total_cost": total_cost,
        "total_revenue": total_revenue,
        "cost_to_income_pct": round(cti, 2),
        "cti_status": cti_status,
    }
