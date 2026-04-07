"""RBAC router — role_permissions and user_roles admin endpoints + current user role.

Tables: role_permissions, user_roles (see migrations/2026_rbac_and_notices.sql).
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


class RolePermissionIn(BaseModel):
    role_name: str
    resource: str
    category: str | None = None
    can_view: bool = True
    can_edit: bool = False


class UserRoleIn(BaseModel):
    role_name: str


# ─── Role Permissions ─────────────────────────────────────────────────────

@router.get("/admin/role-permissions")
async def list_role_permissions(user: dict = Depends(_require_admin)):
    db = get_supabase()
    res = db.table("role_permissions").select("*").order("role_name").execute()
    return {"role_permissions": res.data or []}


@router.put("/admin/role-permissions")
async def upsert_role_permission(data: RolePermissionIn, user: dict = Depends(_require_admin)):
    db = get_supabase()
    row = data.model_dump()
    res = db.table("role_permissions").upsert(
        row, on_conflict="role_name,resource,category"
    ).execute()
    log_audit(user.get("sub"), "UPSERT", "role_permissions", row)
    return {"role_permission": (res.data or [row])[0]}


@router.delete("/admin/role-permissions/{id}")
async def delete_role_permission(id: str, user: dict = Depends(_require_admin)):
    db = get_supabase()
    existing = db.table("role_permissions").select("*").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(404, "role_permission not found")
    db.table("role_permissions").delete().eq("id", id).execute()
    log_audit(user.get("sub"), "DELETE", "role_permissions",
              {"id": id, "old": existing.data[0]})
    return {"deleted": True, "id": id}


# ─── User Roles ───────────────────────────────────────────────────────────

@router.get("/admin/user-roles")
async def list_user_roles(user: dict = Depends(_require_admin)):
    db = get_supabase()
    res = db.table("user_roles").select("*").order("role_name").execute()
    return {"user_roles": res.data or []}


@router.put("/admin/user-roles/{user_id}")
async def set_user_role(user_id: str, data: UserRoleIn, user: dict = Depends(_require_admin)):
    db = get_supabase()
    row = {
        "user_id": user_id,
        "role_name": data.role_name,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    res = db.table("user_roles").upsert(row, on_conflict="user_id").execute()
    log_audit(user.get("sub"), "UPDATE", "user_roles", row)
    return {"user_role": (res.data or [row])[0]}


# ─── Current user role ───────────────────────────────────────────────────

@router.get("/auth/me/role")
async def get_my_role(user: dict = Depends(verify_token)):
    db = get_supabase()
    uid = user.get("sub")
    role_name = None
    try:
        res = db.table("user_roles").select("role_name").eq("user_id", str(uid)).execute()
        if res.data:
            role_name = res.data[0].get("role_name")
    except Exception:
        pass
    # Fallback to JWT app_metadata role if no row in user_roles
    if not role_name:
        role_name = (user.get("app_metadata") or {}).get("role") or user.get("role")
    return {"role_name": role_name}
