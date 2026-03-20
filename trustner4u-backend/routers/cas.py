"""CAS PDF parse endpoint — public, no auth required."""

import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from engines.cas_parser import parse_cas
from engines.shortlist import apply_rebalancing_logic

router = APIRouter()


@router.post("/parse-cas")
async def parse_cas_endpoint(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
):
    """
    Parse a CAMS/KFintech/MFCentral CAS PDF and return structured portfolio JSON.

    Public endpoint — no auth required (client-facing).
    The uploaded PDF is deleted immediately after parsing.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    if file.size and file.size > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum 50MB.")

    tmp_path = None
    try:
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Parse
        portfolio = parse_cas(tmp_path, password=password)

        # Apply rebalancing suggestions automatically
        if portfolio.get("funds"):
            total_value = portfolio.get("summary", {}).get("total_value", 0)
            portfolio["funds"] = apply_rebalancing_logic(portfolio["funds"], total_value)

        return portfolio

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")
    finally:
        # Always delete the temp file — DPDP Act compliance
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
