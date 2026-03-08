"""Auth router — OTP-based advisor login + password-based employee login via Supabase Auth."""

import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from supabase import create_client, Client

from models.schemas import (
    AdvisorLoginRequest,
    VerifyOTPRequest,
    PasswordLoginRequest,
    ChangePasswordRequest,
)

router = APIRouter()
security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Supabase JWT and return user payload."""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def require_manager(user: dict = Depends(verify_token)) -> dict:
    """Verify user has manager role in app_metadata."""
    app_metadata = user.get("app_metadata", {})
    role = app_metadata.get("role", user.get("role", ""))
    if role not in ("manager", "admin", "service_role"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required",
        )
    return user


def require_admin(user: dict = Depends(verify_token)) -> dict:
    """Verify user has admin role in app_metadata."""
    app_metadata = user.get("app_metadata", {})
    role = app_metadata.get("role", user.get("role", ""))
    if role not in ("admin", "service_role"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


# ---------------------------------------------------------------------------
# OTP-based advisor login (existing)
# ---------------------------------------------------------------------------

@router.post("/advisor-login")
async def advisor_login(req: AdvisorLoginRequest):
    """Send OTP to advisor email via Supabase Auth."""
    try:
        sb = get_supabase()
        sb.auth.sign_in_with_otp({"email": req.email})
        return {"message": "OTP sent", "email": req.email}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    """Verify OTP and return session with JWT."""
    try:
        sb = get_supabase()
        response = sb.auth.verify_otp({
            "email": req.email,
            "token": req.token,
            "type": "email",
        })
        session = response.session
        if not session:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "role": response.user.app_metadata.get("role", "advisor"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Password-based employee login (new)
# ---------------------------------------------------------------------------

@router.post("/login")
async def password_login(req: PasswordLoginRequest):
    """Authenticate employee with email + password and return JWT + profile."""
    try:
        sb = get_supabase()

        # Sign in with password via Supabase Auth
        response = sb.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })

        session = response.session
        user = response.user
        if not session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Fetch employee profile from employees table
        employee = None
        try:
            emp_result = (
                sb.table("employees")
                .select("id, name, email, designation, department, role, status, created_at, last_login")
                .eq("auth_id", str(user.id))
                .execute()
            )
            if emp_result.data and len(emp_result.data) > 0:
                employee = emp_result.data[0]
        except Exception:
            pass  # Non-critical — login still works without profile

        # Update last_login timestamp and log activity (non-critical)
        if employee:
            try:
                sb.table("employees").update({
                    "last_login": datetime.now(timezone.utc).isoformat(),
                }).eq("auth_id", str(user.id)).execute()
            except Exception:
                pass  # Non-critical

            try:
                sb.table("activity_log").insert({
                    "employee_id": employee["id"],
                    "action": "login",
                    "details": {"message": f"{employee['name']} logged in"},
                }).execute()
            except Exception:
                pass  # Non-critical — don't fail login over logging

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.app_metadata.get("role", "employee"),
            },
            "employee": employee,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# ---------------------------------------------------------------------------
# Change password (authenticated)
# ---------------------------------------------------------------------------

@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user: dict = Depends(verify_token),
):
    """Change the authenticated user's password."""
    try:
        sb = get_supabase()
        user_email = user.get("email", "")
        user_id = user.get("sub", "")

        # Verify current password by re-signing in
        try:
            sb.auth.sign_in_with_password({
                "email": user_email,
                "password": req.current_password,
            })
        except Exception:
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Update to new password using admin API
        sb.auth.admin.update_user_by_id(
            user_id,
            {"password": req.new_password},
        )

        # Log the activity
        try:
            emp_result = (
                sb.table("employees")
                .select("id, name")
                .eq("auth_id", str(user_id))
                .execute()
            )
            if emp_result.data and len(emp_result.data) > 0:
                sb.table("activity_log").insert({
                    "employee_id": emp_result.data[0]["id"],
                    "action": "password_changed",
                    "details": {"message": f"{emp_result.data[0]['name']} changed their password"},
                }).execute()
        except Exception:
            pass  # Non-critical

        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Current user info (enhanced)
# ---------------------------------------------------------------------------

@router.get("/me")
async def get_me(user: dict = Depends(verify_token)):
    """Return current user info from JWT + employee profile from DB."""
    user_id = user.get("sub")
    user_email = user.get("email")
    user_role = user.get("app_metadata", {}).get("role", "advisor")

    # Try to fetch employee profile
    employee = None
    try:
        sb = get_supabase()
        emp_result = (
            sb.table("employees")
            .select("id, name, email, designation, department, role, status, created_at, last_login")
            .eq("auth_id", str(user_id))
            .execute()
        )
        if emp_result.data and len(emp_result.data) > 0:
            employee = emp_result.data[0]
    except Exception:
        pass  # Fall back to JWT-only data

    return {
        "id": user_id,
        "email": user_email,
        "role": user_role,
        "employee": employee,
    }
