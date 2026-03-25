"""MIS Data Router — centralised Supabase storage for MIS imports."""

import os
import logging
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mis", tags=["MIS Data"])

BATCH_SIZE = 500  # Max rows per Supabase insert to avoid timeouts


# ---------------------------------------------------------------------------
# Supabase client (service key — bypasses RLS)
# ---------------------------------------------------------------------------

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_URL or SUPABASE_SERVICE_KEY not configured",
        )
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class MISImportRequest(BaseModel):
    month: str
    year: str
    fileName: Optional[str] = None
    gi: List[Dict[str, Any]] = []
    health: List[Dict[str, Any]] = []
    life: List[Dict[str, Any]] = []
    mf: List[Dict[str, Any]] = []
    mtd: List[Dict[str, Any]] = []


class MISImportResponse(BaseModel):
    import_id: str
    gi_count: int
    health_count: int
    life_count: int
    mf_count: int
    mtd_count: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case."""
    import re
    s1 = re.sub(r'([A-Z])', r'_\1', name)
    return s1.lower().lstrip('_')


# Map frontend camelCase keys to Supabase snake_case columns per table
_FIELD_MAP = {
    "mis_gi": {
        "slNo": "sl_no", "entryDate": "entry_date", "customerName": "customer_name",
        "contactNo": "contact_no", "policyNo": "policy_no", "referredBy": "referred_by",
        "businessClosedBy": "business_closed_by", "pospName": "posp_name",
        "policyType": "policy_type", "motorPolicyType": "motor_policy_type",
        "subType": "sub_type", "fromDate": "from_date", "toDate": "to_date",
        "odPremium": "od_premium", "tpPremium": "tp_premium", "netPremium": "net_premium",
        "issuedDate": "issued_date", "agencyBroker": "agency_broker",
        "employeeLocation": "employee_location",
    },
    "mis_health": {
        "customerName": "customer_name", "refNo": "ref_no", "paymentDate": "payment_date",
        "advisorName": "advisor_name", "loginMode": "login_mode",
        "paymentMethod": "payment_method", "givenBy": "given_by",
        "businessClosedBy": "business_closed_by", "pospName": "posp_name",
        "companyName": "company_name", "creditPercent": "credit_percent",
        "issuedDate": "issued_date", "employeeLocation": "employee_location",
    },
    "mis_life": {
        "customerName": "customer_name", "advisorName": "advisor_name",
        "givenBy": "given_by", "closedBy": "closed_by", "pospName": "posp_name",
        "policyNo": "policy_no", "basePremium": "base_premium",
        "totalPremium": "total_premium", "paymentType": "payment_type",
        "sumAssured": "sum_assured", "paymentMode": "payment_mode",
        "cashOnline": "cash_online", "issuedDate": "issued_date",
        "isDirect": "is_direct", "creditPct": "credit_pct",
    },
    "mis_mf": {
        "slNo": "sl_no", "transactionDate": "transaction_date",
        "canPanNo": "can_pan_no", "clientType": "client_type",
        "clientName": "client_name", "txnType": "txn_type",
        "txnSubType": "txn_sub_type", "folioNumber": "folio_number",
        "schemeName": "scheme_name", "sipDate": "sip_date",
    },
    "mis_mtd": {
        "ftdNewCall": "ftd_new_call", "ftdFollowUp": "ftd_follow_up",
        "totalBusiness": "total_business",
    },
}


_VALID_COLUMNS = {
    "mis_gi": {"sl_no","entry_date","month","customer_name","contact_no","company",
               "policy_no","referred_by","business_closed_by","posp_name","policy_type",
               "motor_policy_type","sub_type","from_date","to_date","od_premium",
               "tp_premium","net_premium","status","issued_date","agency_broker",
               "employee_location"},
    "mis_health": {"month","date","customer_name","ref_no","product","ped","payment_date",
                   "premium","remarks","advisor_name","login_mode","payment_method",
                   "given_by","business_closed_by","posp_name","company_name",
                   "credit_percent","issued_date","employee_location","status"},
    "mis_life": {"month","date","customer_name","advisor_name","given_by","closed_by",
                 "posp_name","policy_no","base_premium","total_premium","payment_type",
                 "sum_assured","ppt","pt","frequency","type","payment_mode","cash_online",
                 "product","company","status","issued_date","is_direct","credit_pct"},
    "mis_mf": {"sl_no","month","transaction_date","can_pan_no","advisor","sales",
               "client_type","client_name","txn_type","txn_sub_type","folio_number",
               "scheme_name","amount","sip_date"},
    "mis_mtd": {"region","manager","name","role","target","sip","ls","gi","life","health",
                "posp","ftd_new_call","ftd_follow_up","total_business","achievement"},
}


def _convert_row(row: dict, table: str) -> dict:
    """Convert a frontend row (camelCase) to Supabase row (snake_case).
    Only keeps columns that exist in the DB schema."""
    field_map = _FIELD_MAP.get(table, {})
    valid = _VALID_COLUMNS.get(table, set())
    converted = {}
    for key, value in row.items():
        if key in ("id", "import_id"):
            continue
        new_key = field_map.get(key, _camel_to_snake(key))
        if new_key in valid:
            converted[new_key] = value
    return converted


def _batch_insert(supabase, table: str, rows: List[dict], import_id: str):
    """Insert rows in batches of BATCH_SIZE, attaching import_id to each row."""
    if not rows:
        return
    total_inserted = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        converted_batch = []
        for row in batch:
            converted = _convert_row(row, table)
            converted["import_id"] = import_id
            converted_batch.append(converted)
        try:
            supabase.table(table).insert(converted_batch).execute()
            total_inserted += len(converted_batch)
        except Exception as e:
            logger.error(f"Batch insert failed for {table} batch {i}-{i+BATCH_SIZE}: {e}")
            raise
    logger.info(f"Inserted {total_inserted} rows into {table}")


def _snake_to_camel(name: str) -> str:
    """Convert snake_case to camelCase."""
    parts = name.split('_')
    return parts[0] + ''.join(p.capitalize() for p in parts[1:])


def _convert_rows_to_camel(rows: list) -> list:
    """Convert Supabase snake_case rows to camelCase for the frontend."""
    result = []
    for row in rows:
        converted = {}
        for key, value in row.items():
            if key in ("id", "import_id"):
                continue  # Strip internal IDs
            converted[_snake_to_camel(key)] = value
        result.append(converted)
    return result


def _fetch_all_rows(supabase, table: str, import_id: str) -> list:
    """Fetch ALL rows for a table, paginating in chunks of 1000."""
    all_rows: list = []
    page = 0
    while True:
        start = page * 1000
        end = start + 999
        chunk = (
            supabase.table(table)
            .select("*")
            .eq("import_id", import_id)
            .range(start, end)
            .execute()
        )
        all_rows.extend(chunk.data)
        if len(chunk.data) < 1000:
            break
        page += 1
    return all_rows


def _fetch_import_data(supabase, import_id: str) -> dict:
    """Fetch all data tables for a given import_id (paginated)."""
    gi = _fetch_all_rows(supabase, "mis_gi", import_id)
    health = _fetch_all_rows(supabase, "mis_health", import_id)
    life = _fetch_all_rows(supabase, "mis_life", import_id)
    mf = _fetch_all_rows(supabase, "mis_mf", import_id)
    mtd = _fetch_all_rows(supabase, "mis_mtd", import_id)

    return {
        "gi": _convert_rows_to_camel(gi),
        "health": _convert_rows_to_camel(health),
        "life": _convert_rows_to_camel(life),
        "mf": _convert_rows_to_camel(mf),
        "mtd": _convert_rows_to_camel(mtd),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

def _dedup_key_gi(row: dict) -> str:
    """Generate dedup key for GI policy: policy_no + customer_name."""
    pno = str(row.get("policy_no") or row.get("policyNo") or "").strip().lower()
    name = str(row.get("customer_name") or row.get("customerName") or "").strip().lower()
    return f"{pno}|{name}"

def _dedup_key_health(row: dict) -> str:
    """Generate dedup key for Health: customer_name + premium + date."""
    name = str(row.get("customer_name") or row.get("customerName") or "").strip().lower()
    prem = str(row.get("premium") or "0")
    dt = str(row.get("date") or "").strip()
    return f"{name}|{prem}|{dt}"

def _dedup_key_life(row: dict) -> str:
    """Generate dedup key for Life: policy_no + customer_name."""
    pno = str(row.get("policy_no") or row.get("policyNo") or "").strip().lower()
    name = str(row.get("customer_name") or row.get("customerName") or "").strip().lower()
    return f"{pno}|{name}"

def _dedup_key_mf(row: dict) -> str:
    """Generate dedup key for MF: client_name + scheme + txn_date + amount."""
    name = str(row.get("client_name") or row.get("clientName") or "").strip().lower()
    scheme = str(row.get("scheme_name") or row.get("schemeName") or "").strip().lower()
    dt = str(row.get("transaction_date") or row.get("transactionDate") or "").strip()
    amt = str(row.get("amount") or "0")
    return f"{name}|{scheme}|{dt}|{amt}"

def _dedup_key_mtd(row: dict) -> str:
    """Generate dedup key for MTD: name + region."""
    name = str(row.get("name") or "").strip().lower()
    region = str(row.get("region") or "").strip().lower().replace(" ", "")
    return f"{name}|{region}"

_DEDUP_FN = {
    "mis_gi": _dedup_key_gi,
    "mis_health": _dedup_key_health,
    "mis_life": _dedup_key_life,
    "mis_mf": _dedup_key_mf,
    "mis_mtd": _dedup_key_mtd,
}


@router.post("/import", response_model=MISImportResponse)
async def import_mis_data(payload: MISImportRequest):
    """
    Import MIS data — MERGES with existing data instead of replacing.
    Deduplicates by key fields (policy_no+name for GI/Life, name+premium+date for Health, etc.)
    """
    try:
        sb = get_supabase()

        # Check if an import already exists for this month+year
        existing = (
            sb.table("mis_imports")
            .select("id")
            .eq("month", payload.month)
            .eq("year", payload.year)
            .execute()
        )

        import_id = None
        existing_keys: Dict[str, set] = {
            "mis_gi": set(), "mis_health": set(), "mis_life": set(),
            "mis_mf": set(), "mis_mtd": set(),
        }

        if existing.data:
            # MERGE MODE: keep existing import, add only new records
            import_id = existing.data[0]["id"]
            logger.info(f"Merging into existing import {import_id}")

            # Build dedup keys from existing rows
            for table_name, dedup_fn in _DEDUP_FN.items():
                try:
                    existing_rows = _fetch_all_rows(sb, table_name, import_id)
                    for r in existing_rows:
                        # Convert to camelCase for consistent key generation
                        camel_row = {_snake_to_camel(k): v for k, v in r.items()}
                        existing_keys[table_name].add(dedup_fn(camel_row))
                except Exception as e:
                    logger.warning(f"Could not fetch existing {table_name}: {e}")
        else:
            # NEW IMPORT: create fresh import record
            import_record = {
                "month": payload.month,
                "year": payload.year,
                "file_name": payload.fileName,
                "gi_count": 0,
                "health_count": 0,
                "life_count": 0,
                "mf_count": 0,
                "mtd_count": 0,
            }
            result = sb.table("mis_imports").insert(import_record).execute()
            import_id = result.data[0]["id"]

        # Filter out duplicates from new data
        new_gi = [r for r in payload.gi if _dedup_key_gi(r) not in existing_keys["mis_gi"]]
        new_health = [r for r in payload.health if _dedup_key_health(r) not in existing_keys["mis_health"]]
        new_life = [r for r in payload.life if _dedup_key_life(r) not in existing_keys["mis_life"]]
        new_mf = [r for r in payload.mf if _dedup_key_mf(r) not in existing_keys["mis_mf"]]
        # MTD: always replace (it's a summary, not individual records)
        if payload.mtd:
            try:
                sb.table("mis_mtd").delete().eq("import_id", import_id).execute()
            except Exception:
                pass
        new_mtd = payload.mtd

        logger.info(f"Merge: {len(new_gi)} new GI, {len(new_health)} new Health, "
                     f"{len(new_life)} new Life, {len(new_mf)} new MF, {len(new_mtd)} MTD")

        # Insert only new records
        _batch_insert(sb, "mis_gi", new_gi, import_id)
        _batch_insert(sb, "mis_health", new_health, import_id)
        _batch_insert(sb, "mis_life", new_life, import_id)
        _batch_insert(sb, "mis_mf", new_mf, import_id)
        _batch_insert(sb, "mis_mtd", new_mtd, import_id)

        # Update import record counts (total = existing + new)
        total_gi = len(existing_keys["mis_gi"]) + len(new_gi)
        total_health = len(existing_keys["mis_health"]) + len(new_health)
        total_life = len(existing_keys["mis_life"]) + len(new_life)
        total_mf = len(existing_keys["mis_mf"]) + len(new_mf)
        total_mtd = len(new_mtd)
        try:
            sb.table("mis_imports").update({
                "gi_count": total_gi,
                "health_count": total_health,
                "life_count": total_life,
                "mf_count": total_mf,
                "mtd_count": total_mtd,
                "file_name": payload.fileName,
            }).eq("id", import_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update import counts: {e}")

        return MISImportResponse(
            import_id=import_id,
            gi_count=total_gi,
            health_count=total_health,
            life_count=total_life,
            mf_count=total_mf,
            mtd_count=len(payload.mtd),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("MIS import failed")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


class AppendRequest(BaseModel):
    table: str
    rows: List[Dict[str, Any]] = []


@router.post("/import/{import_id}/append")
async def append_rows(import_id: str, payload: AppendRequest):
    """Append additional rows to an existing import (for chunked uploads)."""
    TABLE_MAP = {"gi": "mis_gi", "health": "mis_health", "life": "mis_life", "mf": "mis_mf", "mtd": "mis_mtd"}
    try:
        table = TABLE_MAP.get(payload.table)
        if not table:
            raise HTTPException(status_code=400, detail=f"Invalid table: {payload.table}")
        sb = get_supabase()
        _batch_insert(sb, table, payload.rows, import_id)
        return {"status": "ok", "appended": len(payload.rows)}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Append failed for {payload.table}")
        raise HTTPException(status_code=500, detail=f"Append failed: {str(e)}")


@router.get("/data")
async def get_mis_data(month: str, year: str):
    """Return all MIS data for a given month/year."""
    try:
        sb = get_supabase()

        imp = (
            sb.table("mis_imports")
            .select("*")
            .eq("month", month)
            .eq("year", year)
            .execute()
        )

        if not imp.data:
            raise HTTPException(
                status_code=404,
                detail=f"No MIS data found for {month} {year}",
            )

        import_row = imp.data[0]
        data = _fetch_import_data(sb, import_row["id"])

        return {
            **data,
            "meta": import_row,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch MIS data")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest")
async def get_latest_mis_data():
    """Return the MIS import with the most total records (largest dataset)."""
    try:
        sb = get_supabase()

        imp = (
            sb.table("mis_imports")
            .select("*")
            .order("imported_at", desc=True)
            .limit(10)
            .execute()
        )

        if not imp.data:
            raise HTTPException(status_code=404, detail="No MIS imports found")

        # Pick the import with the most total records
        import_row = max(
            imp.data,
            key=lambda r: (r.get("gi_count", 0) or 0) + (r.get("health_count", 0) or 0) + (r.get("life_count", 0) or 0) + (r.get("mf_count", 0) or 0) + (r.get("mtd_count", 0) or 0)
        )
        data = _fetch_import_data(sb, import_row["id"])

        return {
            **data,
            "meta": import_row,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch latest MIS data")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/imports")
async def list_imports():
    """Return metadata for all MIS imports (for month/year selector)."""
    try:
        sb = get_supabase()

        result = (
            sb.table("mis_imports")
            .select("*")
            .order("imported_at", desc=True)
            .execute()
        )

        return {"imports": result.data}

    except Exception as e:
        logger.exception("Failed to list MIS imports")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/import/{import_id}")
async def delete_import(import_id: str):
    """Delete an import and all its data (CASCADE)."""
    try:
        sb = get_supabase()

        # Verify import exists
        existing = (
            sb.table("mis_imports")
            .select("id")
            .eq("id", import_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Import not found")

        sb.table("mis_imports").delete().eq("id", import_id).execute()

        return {"status": "deleted", "import_id": import_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to delete MIS import")
        raise HTTPException(status_code=500, detail=str(e))
