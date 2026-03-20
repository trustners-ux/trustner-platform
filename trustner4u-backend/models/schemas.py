"""Pydantic models for the MeraSIP S.M.A.R.T API."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# INVESTOR & FUND SCHEMAS
# =============================================================================

class InvestorSchema(BaseModel):
    name: str
    pan: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    folio_count: Optional[int] = None
    report_date: Optional[str] = None


class FundSchema(BaseModel):
    name: str
    amc: Optional[str] = None
    category: Optional[str] = None
    plan: Optional[str] = "Regular"
    folio: Optional[str] = None
    units: Optional[float] = None
    nav: Optional[float] = None
    invested: float = 0
    value: float = 0
    abs_return: Optional[float] = None
    xirr: Optional[float] = None
    action: Optional[str] = None      # HOLD | SWITCH | REVIEW | EXIT
    action_detail: Optional[str] = None  # Switch target fund name
    since: Optional[str] = None
    analysis: Optional[str] = None
    lock_in: bool = False
    lock_in_until: Optional[str] = None


class PortfolioSummarySchema(BaseModel):
    total_invested: float
    total_value: float
    total_gain: float
    abs_return: float
    xirr: Optional[float] = None


# =============================================================================
# INDIVIDUAL PORTFOLIO (feeds trustner_report.py)
# =============================================================================

class IndividualPortfolioSchema(BaseModel):
    investor: InvestorSchema
    summary: PortfolioSummarySchema
    funds: list[FundSchema]


# =============================================================================
# FAMILY PORTFOLIO (feeds family_report.py)
# =============================================================================

class FamilyMemberFundSchema(BaseModel):
    name: str
    cat: Optional[str] = None
    inv: float = 0
    val: float = 0
    abs: Optional[float] = None
    xirr: Optional[float] = None
    action: Optional[str] = None
    since: Optional[str] = None


class FamilyMemberSchema(BaseModel):
    id: str
    name: str
    pan: Optional[str] = None
    folio_id: Optional[str] = None
    type: str = "Individual"
    relation: Optional[str] = None
    inv: float = 0
    val: float = 0
    gain: float = 0
    abs_return: Optional[float] = None
    xirr: Optional[float] = None
    risk_profile: Optional[str] = None
    sip_monthly: Optional[float] = None
    age_band: Optional[str] = None
    horizon: Optional[str] = None
    funds: list[FamilyMemberFundSchema] = []
    advice: list[list[str]] = []


class FamilyPortfolioSchema(BaseModel):
    group_name: str
    group_subtitle: str = "Consolidated Mutual Fund Portfolio Review"
    report_date: str
    sensex: Optional[str] = None
    members: list[FamilyMemberSchema]


# =============================================================================
# API REQUEST/RESPONSE SCHEMAS
# =============================================================================

class ReportRequestSchema(BaseModel):
    type: str = Field(..., pattern="^(individual|family)$")
    data: dict  # Either IndividualPortfolio or FamilyPortfolio


class EmailReportRequest(BaseModel):
    report_id: str
    client_email: str
    client_name: str


class WhatsAppReportRequest(BaseModel):
    report_id: str
    client_mobile: str
    client_name: str
    xirr: Optional[float] = None


class ClientCreate(BaseModel):
    name: str
    pan: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    type: str = "Individual"


class NAVResponse(BaseModel):
    scheme_code: str
    scheme_name: Optional[str] = None
    nav: Optional[float] = None
    date: Optional[str] = None


class CASParseResponse(BaseModel):
    investor: InvestorSchema
    summary: PortfolioSummarySchema
    funds: list[FundSchema]


# =============================================================================
# REVIEW WORKFLOW SCHEMAS
# =============================================================================

class ReviewSubmitRequest(BaseModel):
    client_name: str
    client_email: Optional[str] = None
    client_mobile: Optional[str] = None
    client_pan: Optional[str] = None
    portfolio_data: dict
    suggested_actions: Optional[dict] = None


class ReviewDecision(BaseModel):
    status: str = Field(..., pattern="^(in_review|approved|rejected)$")
    curated_actions: Optional[dict] = None
    reviewer_notes: Optional[str] = None


class ReviewQueueItem(BaseModel):
    id: str
    client_name: str
    client_email: Optional[str] = None
    client_mobile: Optional[str] = None
    portfolio_data: dict
    suggested_actions: Optional[dict] = None
    curated_actions: Optional[dict] = None
    status: str
    reviewer_notes: Optional[str] = None
    original_upload_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None


class AdvisorLoginRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    token: str


# =============================================================================
# EMPLOYEE MANAGEMENT SCHEMAS
# =============================================================================

class PasswordLoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class EmployeeCreate(BaseModel):
    name: str
    email: str
    password: str
    designation: str
    department: Optional[str] = None
    role: str = "employee"


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
