"""Audit logging helper — writes rows to the audit_log table.

Table schema (see migrations/2026_rbac_and_notices.sql):
  audit_log(id uuid, user_id uuid, action text, entity text, ip text,
            user_agent text, metadata jsonb, created_at timestamptz)
"""

from typing import Any, Optional

from routers.auth import get_supabase


def log_audit(
    user_id: Optional[str],
    action: str,
    entity: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Insert a row into audit_log. Never raises — audit must never break a request."""
    try:
        db = get_supabase()
        row: dict[str, Any] = {
            "action": action,
        }
        if user_id:
            row["user_id"] = str(user_id)
        if entity:
            row["entity"] = entity
        if metadata is not None:
            row["metadata"] = metadata
        if ip:
            row["ip"] = ip
        if user_agent:
            row["user_agent"] = user_agent
        db.table("audit_log").insert(row).execute()
    except Exception:
        # Intentionally swallowed — audit logging must not affect user flow.
        pass
