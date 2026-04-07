"""Notices router — public list for authenticated users, admin CRUD.

Table: notices (see migrations/2026_rbac_and_notices.sql).
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from routers.auth import verify_token, get_supabase
from utils.audit import log_audit

router = APIRouter()


def _require_admin(user: dict = Depends(verify_token)) -> dict:
    role = (user.get("app_metadata") or {}).get("role", "employee")
    if role not in ("admin", "service_role"):
        raise HTTPException(403, "Admin access required")
    return user


class NoticeIn(BaseModel):
    title: str
    body: str
    priority: str | None = "info"
    expires_at: str | None = None
    active: bool | None = True


class NoticeUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    priority: str | None = None
    expires_at: str | None = None
    active: bool | None = None


# ─── Public (authenticated) ──────────────────────────────────────────────

@router.get("/notices")
async def list_notices(user: dict = Depends(verify_token)):
    """List all active, non-expired notices."""
    db = get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        res = (
            db.table("notices")
            .select("*")
            .eq("active", True)
            .or_(f"expires_at.is.null,expires_at.gt.{now_iso}")
            .order("created_at", desc=True)
            .execute()
        )
    except Exception:
        # Fallback without or_() if unsupported syntax
        res = db.table("notices").select("*").eq("active", True).order("created_at", desc=True).execute()
    return {"notices": res.data or []}


# ─── Admin CRUD ──────────────────────────────────────────────────────────

@router.post("/admin/notices")
async def create_notice(data: NoticeIn, user: dict = Depends(_require_admin)):
    db = get_supabase()
    row = {k: v for k, v in data.model_dump().items() if v is not None}
    row["author_id"] = user.get("sub")
    res = db.table("notices").insert(row).execute()
    notice = (res.data or [row])[0]
    log_audit(user.get("sub"), "CREATE", "notices", {"new": notice})
    return {"notice": notice}


@router.put("/admin/notices/{notice_id}")
async def update_notice(notice_id: str, data: NoticeUpdate, user: dict = Depends(_require_admin)):
    db = get_supabase()
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    existing = db.table("notices").select("*").eq("id", notice_id).execute()
    if not existing.data:
        raise HTTPException(404, "Notice not found")
    res = db.table("notices").update(update).eq("id", notice_id).execute()
    log_audit(user.get("sub"), "UPDATE", "notices",
              {"id": notice_id, "old": existing.data[0], "new": update})
    return {"notice": (res.data or [update])[0]}


@router.delete("/admin/notices/{notice_id}")
async def delete_notice(notice_id: str, user: dict = Depends(_require_admin)):
    db = get_supabase()
    existing = db.table("notices").select("*").eq("id", notice_id).execute()
    if not existing.data:
        raise HTTPException(404, "Notice not found")
    db.table("notices").delete().eq("id", notice_id).execute()
    log_audit(user.get("sub"), "DELETE", "notices",
              {"id": notice_id, "old": existing.data[0]})
    return {"deleted": True, "id": notice_id}
