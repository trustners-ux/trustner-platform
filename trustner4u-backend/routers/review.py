"""Review workflow router — manager-level review of portfolio suggestions."""

import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client

from models.schemas import ReviewSubmitRequest, ReviewDecision
from routers.auth import verify_token, require_manager

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.post("/submit")
async def submit_for_review(req: ReviewSubmitRequest):
    """
    Submit a parsed portfolio for manual review by Trustner team.
    Public endpoint — called from /review page when client clicks "Request Expert Review".
    """
    try:
        sb = get_supabase()
        result = sb.table("review_queue").insert({
            "client_name": req.client_name,
            "client_email": req.client_email,
            "client_mobile": req.client_mobile,
            "client_pan": req.client_pan,
            "portfolio_data": req.portfolio_data,
            "suggested_actions": req.suggested_actions,
            "status": "pending_review",
        }).execute()

        return {
            "success": True,
            "review_id": result.data[0]["id"] if result.data else None,
            "message": "Your portfolio has been submitted for expert review. "
                       "Our team will review and share a curated report within 24 hours.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue")
async def list_review_queue(
    status: str = None,
    user: dict = Depends(require_manager),
):
    """List all items in the review queue. Manager only."""
    try:
        sb = get_supabase()
        query = sb.table("review_queue").select("*").order("created_at", desc=True)
        if status:
            query = query.eq("status", status)
        result = query.limit(100).execute()
        return {"items": result.data or [], "total": len(result.data or [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue/{review_id}")
async def get_review_item(review_id: str, user: dict = Depends(require_manager)):
    """Get a single review queue item with full portfolio data. Manager only."""
    try:
        sb = get_supabase()
        result = sb.table("review_queue").select("*").eq("id", review_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Review item not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/queue/{review_id}")
async def update_review(
    review_id: str,
    decision: ReviewDecision,
    user: dict = Depends(require_manager),
):
    """
    Update a review queue item — edit suggestions, approve, or reject.
    Manager only.
    """
    try:
        sb = get_supabase()
        update_data = {
            "status": decision.status,
            "reviewer_id": user.get("sub"),
        }

        if decision.curated_actions is not None:
            update_data["curated_actions"] = decision.curated_actions

        if decision.reviewer_notes is not None:
            update_data["reviewer_notes"] = decision.reviewer_notes

        if decision.status == "in_review":
            update_data["reviewed_at"] = datetime.utcnow().isoformat()
        elif decision.status == "approved":
            update_data["approved_at"] = datetime.utcnow().isoformat()
            update_data["reviewed_at"] = update_data.get(
                "reviewed_at", datetime.utcnow().isoformat()
            )

        result = sb.table("review_queue").update(update_data).eq("id", review_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Review item not found")

        return {"success": True, "item": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/queue/{review_id}/generate")
async def generate_reviewed_report(
    review_id: str,
    user: dict = Depends(require_manager),
):
    """
    Generate a PDF report from the manager-curated review data.
    This uses the curated_actions (if available) instead of auto-generated suggestions.
    Manager only.
    """
    import tempfile
    from engines.trustner_report import build_report as build_individual
    from engines.family_report import build_report as build_family

    try:
        sb = get_supabase()
        review = sb.table("review_queue").select("*").eq("id", review_id).single().execute()
        if not review.data:
            raise HTTPException(status_code=404, detail="Review item not found")

        item = review.data
        if item["status"] != "approved":
            raise HTTPException(status_code=400, detail="Review must be approved before generating report")

        portfolio = item["portfolio_data"]
        curated = item.get("curated_actions")

        # Apply curated actions to portfolio if available
        if curated and isinstance(curated, dict):
            funds = portfolio.get("funds", [])
            curated_by_name = {a.get("name", ""): a for a in curated.get("funds", [])}
            for fund in funds:
                if fund["name"] in curated_by_name:
                    override = curated_by_name[fund["name"]]
                    fund["action"] = override.get("action", fund.get("action"))
                    fund["analysis"] = override.get("analysis", fund.get("analysis"))
                    fund["action_detail"] = override.get("action_detail", fund.get("action_detail"))

        # Determine report type and generate
        members = portfolio.get("members")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            output_path = tmp.name

        if members and len(members) > 1:
            build_family(output_path, portfolio)
            report_type = "family"
        else:
            investor = portfolio.get("investor", {"name": item["client_name"]})
            funds = portfolio.get("funds", [])
            build_individual(output_path, investor, funds)
            report_type = "individual"

        # Upload to Supabase Storage
        bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "reports")
        file_name = f"review_{review_id}_{report_type}.pdf"
        with open(output_path, "rb") as f:
            sb.storage.from_(bucket).upload(file_name, f.read(), {"content-type": "application/pdf"})

        # Get signed URL (7 days)
        signed = sb.storage.from_(bucket).create_signed_url(file_name, 7 * 24 * 3600)
        pdf_url = signed.get("signedURL", "")

        # Save report record
        report_result = sb.table("reports").insert({
            "type": report_type,
            "pdf_url": pdf_url,
        }).execute()

        report_id = report_result.data[0]["id"] if report_result.data else None

        # Update review queue with report link
        sb.table("review_queue").update({
            "report_id": report_id,
        }).eq("id", review_id).execute()

        # Clean up temp file
        os.unlink(output_path)

        return {
            "success": True,
            "report_id": report_id,
            "pdf_url": pdf_url,
            "type": report_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
