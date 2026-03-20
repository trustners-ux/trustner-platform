"""Portfolio & Clients router — CRUD for clients and portfolio snapshots."""

import os
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client

from models.schemas import ClientCreate
from routers.auth import verify_token

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/clients")
async def list_clients(user: dict = Depends(verify_token)):
    """List all clients for the logged-in advisor."""
    try:
        sb = get_supabase()
        advisor_id = user.get("sub")
        result = (
            sb.table("clients")
            .select("*")
            .eq("advisor_id", advisor_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"clients": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clients")
async def create_client(client: ClientCreate, user: dict = Depends(verify_token)):
    """Create a new client (manual entry)."""
    try:
        sb = get_supabase()
        advisor_id = user.get("sub")
        result = sb.table("clients").insert({
            "advisor_id": advisor_id,
            "name": client.name,
            "pan": client.pan,
            "mobile": client.mobile,
            "email": client.email,
            "type": client.type,
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create client")

        return {"success": True, "client": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clients/{client_id}")
async def get_client(client_id: str, user: dict = Depends(verify_token)):
    """Get a single client by ID."""
    try:
        sb = get_supabase()
        result = sb.table("clients").select("*").eq("id", client_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Client not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clients/{client_id}/portfolio")
async def get_portfolio(client_id: str, user: dict = Depends(verify_token)):
    """Get the latest portfolio snapshot for a client."""
    try:
        sb = get_supabase()
        result = (
            sb.table("portfolios")
            .select("*")
            .eq("client_id", client_id)
            .order("uploaded_at", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="No portfolio found for this client")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clients/{client_id}/portfolio")
async def save_portfolio(client_id: str, portfolio: dict, user: dict = Depends(verify_token)):
    """Save a portfolio snapshot for a client."""
    try:
        sb = get_supabase()
        summary = portfolio.get("summary", {})
        result = sb.table("portfolios").insert({
            "client_id": client_id,
            "report_date": portfolio.get("investor", {}).get("report_date"),
            "total_inv": summary.get("total_invested"),
            "total_val": summary.get("total_value"),
            "xirr": summary.get("xirr"),
            "abs_return": summary.get("abs_return"),
            "data": portfolio,
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save portfolio")

        return {"success": True, "portfolio_id": result.data[0]["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
