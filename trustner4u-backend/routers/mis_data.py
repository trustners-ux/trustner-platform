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

def _batch_insert(supabase, table: str, rows: List[dict], import_id: str):
    """Insert rows in batches of BATCH_SIZE, attaching import_id to each row."""
    if not rows:
        return
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        for row in batch:
            row["import_id"] = import_id
        supabase.table(table).insert(batch).execute()


def _fetch_import_data(supabase, import_id: str) -> dict:
    """Fetch all data tables for a given import_id."""
    gi = supabase.table("mis_gi").select("*").eq("import_id", import_id).execute()
    health = supabase.table("mis_health").select("*").eq("import_id", import_id).execute()
    life = supabase.table("mis_life").select("*").eq("import_id", import_id).execute()

    # MF can be large — paginate with range to fetch all rows
    mf_rows: list = []
    page = 0
    while True:
        start = page * 1000
        end = start + 999
        chunk = (
            supabase.table("mis_mf")
            .select("*")
            .eq("import_id", import_id)
            .range(start, end)
            .execute()
        )
        mf_rows.extend(chunk.data)
        if len(chunk.data) < 1000:
            break
        page += 1

    mtd = supabase.table("mis_mtd").select("*").eq("import_id", import_id).execute()

    return {
        "gi": gi.data,
        "health": health.data,
        "life": life.data,
        "mf": mf_rows,
        "mtd": mtd.data,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/import", response_model=MISImportResponse)
async def import_mis_data(payload: MISImportRequest):
    """
    Import MIS data for a given month/year.
    If data already exists for that month+year it is replaced (upsert).
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

        # Delete old import if it exists (CASCADE removes child rows)
        if existing.data:
            old_id = existing.data[0]["id"]
            sb.table("mis_imports").delete().eq("id", old_id).execute()

        # Create new import record
        import_record = {
            "month": payload.month,
            "year": payload.year,
            "file_name": payload.fileName,
            "gi_count": len(payload.gi),
            "health_count": len(payload.health),
            "life_count": len(payload.life),
            "mf_count": len(payload.mf),
            "mtd_count": len(payload.mtd),
        }
        result = sb.table("mis_imports").insert(import_record).execute()
        import_id = result.data[0]["id"]

        # Insert data into child tables (batched)
        _batch_insert(sb, "mis_gi", payload.gi, import_id)
        _batch_insert(sb, "mis_health", payload.health, import_id)
        _batch_insert(sb, "mis_life", payload.life, import_id)
        _batch_insert(sb, "mis_mf", payload.mf, import_id)
        _batch_insert(sb, "mis_mtd", payload.mtd, import_id)

        return MISImportResponse(
            import_id=import_id,
            gi_count=len(payload.gi),
            health_count=len(payload.health),
            life_count=len(payload.life),
            mf_count=len(payload.mf),
            mtd_count=len(payload.mtd),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("MIS import failed")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


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
    """Return the most recent MIS import and its data."""
    try:
        sb = get_supabase()

        imp = (
            sb.table("mis_imports")
            .select("*")
            .order("imported_at", desc=True)
            .limit(1)
            .execute()
        )

        if not imp.data:
            raise HTTPException(status_code=404, detail="No MIS imports found")

        import_row = imp.data[0]
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
