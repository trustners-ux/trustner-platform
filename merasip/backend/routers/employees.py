"""Employees router — CRUD + admin management for MeraSIP team members."""

import os
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import create_client, Client

from models.schemas import EmployeeCreate, EmployeeUpdate
from routers.auth import verify_token, require_admin

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _generate_password(length: int = 16) -> str:
    """Generate a random password of given length."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ---------------------------------------------------------------------------
# List employees (any authenticated user)
# ---------------------------------------------------------------------------

@router.get("/")
async def list_employees(user: dict = Depends(verify_token)):
    """Return all employees ordered by role priority (admin > manager > employee), then name."""
    try:
        sb = get_supabase()
        result = (
            sb.table("employees")
            .select("id, name, email, designation, department, role, status, last_login, created_at")
            .order("name")
            .execute()
        )
        employees = result.data or []

        # Sort by role priority: admin first, then manager, then employee
        role_priority = {"admin": 0, "manager": 1, "employee": 2}
        employees.sort(key=lambda e: (role_priority.get(e.get("role", "employee"), 99), e.get("name", "")))

        return employees
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Activity log (admin sees all)
# ---------------------------------------------------------------------------

@router.get("/activity")
async def get_activity_log(user: dict = Depends(verify_token)):
    """Return recent activity log entries. Admin sees all."""
    try:
        sb = get_supabase()
        result = (
            sb.table("activity_log")
            .select("id, employee_id, action, details, created_at, employees(name)")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Single employee detail (any authenticated user)
# ---------------------------------------------------------------------------

@router.get("/{employee_id}")
async def get_employee(employee_id: str, user: dict = Depends(verify_token)):
    """Return a single employee by ID."""
    try:
        sb = get_supabase()
        result = (
            sb.table("employees")
            .select("id, name, email, designation, department, role, status, last_login, created_at")
            .eq("id", employee_id)
            .maybe_single()
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Employee not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Create employee (admin only)
# ---------------------------------------------------------------------------

@router.post("/")
async def create_employee(req: EmployeeCreate, admin: dict = Depends(require_admin)):
    """Create a new employee: Supabase Auth user + employees table record."""
    try:
        sb = get_supabase()

        # Create Supabase Auth user with admin API
        auth_response = sb.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "app_metadata": {"role": req.role},
        })
        auth_user = auth_response.user
        if not auth_user:
            raise HTTPException(status_code=500, detail="Failed to create auth user")

        # Create employee record in employees table
        emp_result = (
            sb.table("employees")
            .insert({
                "auth_id": auth_user.id,
                "name": req.name,
                "email": req.email,
                "designation": req.designation,
                "department": req.department,
                "role": req.role,
                "status": "active",
            })
            .execute()
        )
        employee = emp_result.data[0] if emp_result.data else None

        # Log the activity
        admin_id = admin.get("sub", "")
        try:
            admin_emp = (
                sb.table("employees")
                .select("id, name")
                .eq("auth_id", admin_id)
                .maybe_single()
                .execute()
            )
            if admin_emp.data and employee:
                sb.table("activity_log").insert({
                    "employee_id": admin_emp.data["id"],
                    "action": "create_employee",
                    "details": {"message": f"{admin_emp.data['name']} created employee {req.name}"},
                }).execute()
        except Exception:
            pass  # Non-critical

        return {
            "employee": employee,
            "credentials": {
                "email": req.email,
                "password": req.password,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Update employee (admin only)
# ---------------------------------------------------------------------------

@router.patch("/{employee_id}")
async def update_employee(
    employee_id: str,
    req: EmployeeUpdate,
    admin: dict = Depends(require_admin),
):
    """Update employee fields. If role changes, also update Supabase Auth app_metadata."""
    try:
        sb = get_supabase()

        # Fetch existing employee to get auth_id
        existing = (
            sb.table("employees")
            .select("id, auth_id, name, role")
            .eq("id", employee_id)
            .maybe_single()
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Build update payload (only non-None fields)
        update_data = {}
        if req.name is not None:
            update_data["name"] = req.name
        if req.designation is not None:
            update_data["designation"] = req.designation
        if req.department is not None:
            update_data["department"] = req.department
        if req.role is not None:
            update_data["role"] = req.role
        if req.status is not None:
            update_data["status"] = req.status

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Update employees table
        result = (
            sb.table("employees")
            .update(update_data)
            .eq("id", employee_id)
            .execute()
        )

        # If role changed, update Supabase Auth app_metadata
        if req.role is not None and req.role != existing.data.get("role"):
            auth_id = existing.data.get("auth_id")
            if auth_id:
                sb.auth.admin.update_user_by_id(
                    auth_id,
                    {"app_metadata": {"role": req.role}},
                )

        # Log the activity
        admin_id = admin.get("sub", "")
        try:
            admin_emp = (
                sb.table("employees")
                .select("id, name")
                .eq("auth_id", admin_id)
                .maybe_single()
                .execute()
            )
            if admin_emp.data:
                sb.table("activity_log").insert({
                    "employee_id": admin_emp.data["id"],
                    "action": "update_employee",
                    "details": {"message": f"{admin_emp.data['name']} updated employee {existing.data.get('name', employee_id)}"},
                }).execute()
        except Exception:
            pass  # Non-critical

        updated = result.data[0] if result.data else None
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Reset employee password (admin only)
# ---------------------------------------------------------------------------

@router.post("/{employee_id}/reset-password")
async def reset_employee_password(
    employee_id: str,
    admin: dict = Depends(require_admin),
):
    """Admin resets an employee's password to a random 16-character string."""
    try:
        sb = get_supabase()

        # Fetch employee to get auth_id
        emp_result = (
            sb.table("employees")
            .select("id, auth_id, name")
            .eq("id", employee_id)
            .maybe_single()
            .execute()
        )
        if not emp_result.data:
            raise HTTPException(status_code=404, detail="Employee not found")

        auth_id = emp_result.data.get("auth_id")
        if not auth_id:
            raise HTTPException(status_code=400, detail="Employee has no linked auth account")

        # Generate new random password
        new_password = _generate_password(16)

        # Update password via Supabase admin API
        sb.auth.admin.update_user_by_id(
            auth_id,
            {"password": new_password},
        )

        # Log the activity
        admin_id = admin.get("sub", "")
        try:
            admin_emp = (
                sb.table("employees")
                .select("id, name")
                .eq("auth_id", admin_id)
                .maybe_single()
                .execute()
            )
            if admin_emp.data:
                sb.table("activity_log").insert({
                    "employee_id": admin_emp.data["id"],
                    "action": "reset_password",
                    "details": {"message": f"{admin_emp.data['name']} reset password for {emp_result.data.get('name', employee_id)}"},
                }).execute()
        except Exception:
            pass  # Non-critical

        return {
            "message": "Password reset successfully",
            "employee_id": employee_id,
            "new_password": new_password,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
