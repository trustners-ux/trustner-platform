"""Reports router — PDF generation, email, and WhatsApp delivery."""

import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from supabase import create_client, Client
import httpx

from models.schemas import ReportRequestSchema, EmailReportRequest, WhatsAppReportRequest
from routers.auth import verify_token

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
INTERAKT_API_KEY = os.getenv("INTERAKT_API_KEY", "")


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.post("/generate-report")
async def generate_report(
    req: ReportRequestSchema,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_token),
):
    """
    Generate a branded PDF report from portfolio JSON.
    Returns a signed download URL (7-day expiry).
    """
    from engines.trustner_report import build_report as build_individual
    from engines.family_report import build_report as build_family

    try:
        # Create temp file for PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            output_path = tmp.name

        # Generate PDF based on type
        if req.type == "individual":
            data = req.data
            investor = data.get("investor", {})
            funds = data.get("funds", [])
            build_individual(output_path, investor, funds)
        elif req.type == "family":
            build_family(output_path, req.data)
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")

        # Upload to Supabase Storage
        sb = get_supabase()
        bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "reports")
        file_name = f"{req.type}_{user.get('sub', 'anon')}_{os.path.basename(output_path)}"

        with open(output_path, "rb") as f:
            sb.storage.from_(bucket).upload(file_name, f.read(), {"content-type": "application/pdf"})

        # Get signed URL (7 days)
        signed = sb.storage.from_(bucket).create_signed_url(file_name, 7 * 24 * 3600)
        pdf_url = signed.get("signedURL", "")

        # Save report metadata to DB
        report_data = {
            "type": req.type,
            "pdf_url": pdf_url,
        }

        # Try to link to client
        client_id = req.data.get("client_id")
        if client_id:
            report_data["client_id"] = client_id

        group_id = req.data.get("group_id")
        if group_id:
            report_data["group_id"] = group_id

        result = sb.table("reports").insert(report_data).execute()
        report_id = result.data[0]["id"] if result.data else None

        # Clean up temp file in background
        background_tasks.add_task(os.unlink, output_path)

        return {
            "success": True,
            "report_id": report_id,
            "pdf_url": pdf_url,
            "type": req.type,
        }
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if os.path.exists(output_path):
            os.unlink(output_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-report/email")
async def send_report_email(
    req: EmailReportRequest,
    user: dict = Depends(verify_token),
):
    """
    Send a generated report via email using Brevo API.
    From: wecare@finedgeservices.com
    """
    if not BREVO_API_KEY:
        raise HTTPException(status_code=503, detail="Email service not configured")

    try:
        # Get report URL
        sb = get_supabase()
        report = sb.table("reports").select("*").eq("id", req.report_id).single().execute()
        if not report.data:
            raise HTTPException(status_code=404, detail="Report not found")

        pdf_url = report.data.get("pdf_url", "")

        # Send via Brevo
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "sender": {
                        "name": "MeraSIP by Trustner",
                        "email": "wecare@finedgeservices.com",
                    },
                    "to": [{"email": req.client_email, "name": req.client_name}],
                    "subject": "Your MeraSIP Portfolio Review is ready",
                    "htmlContent": f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: #1B3A6B; padding: 24px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 20px;">MeraSIP S.M.A.R.T Portfolio Review</h1>
                                <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">ARN-286886</p>
                            </div>
                            <div style="padding: 24px; background: #fff;">
                                <p>Dear {req.client_name},</p>
                                <p>Your portfolio review report is ready. Click the button below to download your report:</p>
                                <div style="text-align: center; margin: 24px 0;">
                                    <a href="{pdf_url}" style="background: #1B3A6B; color: white; padding: 12px 32px;
                                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                                        Download Report
                                    </a>
                                </div>
                                <p style="font-size: 12px; color: #6B7280;">This link expires in 7 days.</p>
                            </div>
                            <div style="background: #F4F6F9; padding: 16px; font-size: 11px; color: #6B7280;">
                                <p>Trustner Asset Services Pvt. Ltd. | ARN-286886 | EUIN: E092119</p>
                                <p>Mutual fund investments are subject to market risks. Read all scheme related documents carefully before investing.</p>
                                <p>We earn distributor commissions from AMCs on investments made through us.</p>
                            </div>
                        </div>
                    """,
                },
            )

        if response.status_code in (200, 201):
            # Mark report as sent via email
            sb.table("reports").update({"sent_email": True}).eq("id", req.report_id).execute()
            message_id = response.json().get("messageId", "")
            return {"success": True, "message_id": message_id}
        else:
            raise HTTPException(status_code=response.status_code, detail="Email delivery failed")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-report/whatsapp")
async def send_report_whatsapp(
    req: WhatsAppReportRequest,
    user: dict = Depends(verify_token),
):
    """
    Send a report via WhatsApp Business API (Interakt).
    Uses the pre-approved template: merasip_portfolio_review
    """
    if not INTERAKT_API_KEY:
        raise HTTPException(status_code=503, detail="WhatsApp service not configured")

    try:
        # Get report URL
        sb = get_supabase()
        report = sb.table("reports").select("*").eq("id", req.report_id).single().execute()
        if not report.data:
            raise HTTPException(status_code=404, detail="Report not found")

        pdf_url = report.data.get("pdf_url", "")
        xirr_str = f"{req.xirr:.1f}" if req.xirr else "N/A"

        # Ensure mobile has country code
        mobile = req.client_mobile
        if not mobile.startswith("+"):
            mobile = f"+91{mobile}" if not mobile.startswith("91") else f"+{mobile}"

        # Send via Interakt API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.interakt.ai/v1/public/message/",
                headers={
                    "Authorization": f"Basic {INTERAKT_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "countryCode": "+91",
                    "phoneNumber": mobile.replace("+91", ""),
                    "callbackData": "merasip_report",
                    "type": "Template",
                    "template": {
                        "name": "merasip_portfolio_review",
                        "languageCode": "en",
                        "bodyValues": [
                            req.client_name,
                            xirr_str,
                            pdf_url,
                        ],
                    },
                },
            )

        if response.status_code in (200, 201, 202):
            sb.table("reports").update({"sent_whatsapp": True}).eq("id", req.report_id).execute()
            return {"success": True}
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"WhatsApp delivery failed: {response.text}",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/{client_id}")
async def list_reports(client_id: str, user: dict = Depends(verify_token)):
    """List all generated reports for a client."""
    try:
        sb = get_supabase()
        result = (
            sb.table("reports")
            .select("*")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"reports": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
