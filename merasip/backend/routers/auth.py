"""Auth router — OTP-based advisor login via Supabase Auth."""

import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from supabase import create_client, Client

from models.schemas import AdvisorLoginRequest, VerifyOTPRequest

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
        # Supabase JWTs are signed with the JWT secret (same as SUPABASE_SERVICE_KEY for service role)
        # For client JWTs, we verify against the Supabase JWT secret
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


@router.get("/me")
async def get_me(user: dict = Depends(verify_token)):
    """Return current user info from JWT."""
    return {
        "id": user.get("sub"),
        "email": user.get("email"),
        "role": user.get("app_metadata", {}).get("role", "advisor"),
    }
