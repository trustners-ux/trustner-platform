"""
family_report.py
================
Multi-member family portfolio PDF report generator for MeraSIP by Trustner.

Generates a professional, print-ready A4 PDF with:
  - Cover page, disclaimer, family dashboard
  - Per-member portfolio sections with fund tables & advice
  - Consolidated category distribution
  - Family rebalancing plan
  - MeraSIP shortlist reference
  - Back page with company info

Company : Trustner Asset Services Pvt. Ltd.
ARN     : ARN-286886
EUIN    : E092119
CIN     : U66301AS2023PTC025505

Usage:
    from engines.family_report import build_report
    path = build_report("output/report.pdf", family_data_dict)
"""

from __future__ import annotations

import math
import os
from typing import Any, Dict, List, Optional, Tuple

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
    PageBreak,
    CondPageBreak,
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics import renderPDF

# ---------------------------------------------------------------------------
# Brand constants
# ---------------------------------------------------------------------------
NAVY = "#1B3A6B"
NAVY_DIM = "#2E5299"
NAVY_PALE = "#E8EEF8"
EMERALD = "#0A7C4E"
CRIMSON = "#B91C1C"
AMBER = "#92400E"
VIOLET = "#5B21B6"
INK = "#111827"
BORDER = "#D1D5DB"
BG = "#F4F6F9"
WHITE = "#FFFFFF"

MEMBER_COLORS = [
    "#1B3A6B",
    "#0A7C4E",
    "#B91C1C",
    "#5B21B6",
    "#92400E",
    "#2E5299",
]

ACTION_COLORS = {
    "HOLD": EMERALD,
    "SWITCH": CRIMSON,
    "REVIEW": AMBER,
    "ADD": VIOLET,
    "EXIT": CRIMSON,
    "SIP": NAVY,
}

# ---------------------------------------------------------------------------
# Company details
# ---------------------------------------------------------------------------
COMPANY_NAME = "Trustner Asset Services Pvt. Ltd."
ARN = "ARN-286886"
EUIN = "E092119"
CIN = "U66301AS2023PTC025505"
ADDRESS = (
    "Sethi Trust, Unit 2, 4th Floor, G S Road, Bhangagarh, "
    "Dispur, Guwahati \u2013 781005, Assam"
)
EMAIL = "wecare@finedgeservices.com"
WEB = "www.merasip.com"
PHONE = "+91 60039 03731"
BRAND = "MeraSIP by Trustner"
AMFI_DISCLAIMER_SHORT = (
    "Mutual Fund investments are subject to market risks. "
    "Read all scheme related documents carefully."
)

PAGE_W, PAGE_H = A4  # 595.27, 841.89 points
MARGIN_LEFT = 18 * mm
MARGIN_RIGHT = 18 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 22 * mm
CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT

# ---------------------------------------------------------------------------
# Helpers: colour parsing
# ---------------------------------------------------------------------------

def _hex(hex_str: str) -> colors.Color:
    """Convert a hex colour string to a ReportLab Color object."""
    h = hex_str.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return colors.Color(r / 255.0, g / 255.0, b / 255.0)


def _hex_alpha(hex_str: str, alpha: float) -> colors.Color:
    """Hex colour with alpha channel."""
    h = hex_str.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return colors.Color(r / 255.0, g / 255.0, b / 255.0, alpha)


# ---------------------------------------------------------------------------
# INR formatting helpers
# ---------------------------------------------------------------------------

def _fmt_inr(value: Optional[float], short: bool = False) -> str:
    """Format a number as INR with lakhs/crores notation when short=True."""
    if value is None:
        return "--"
    try:
        v = float(value)
    except (TypeError, ValueError):
        return "--"

    if short:
        abs_v = abs(v)
        sign = "-" if v < 0 else ""
        if abs_v >= 1_00_00_000:
            return f"{sign}\u20b9{abs_v / 1_00_00_000:.2f} Cr"
        elif abs_v >= 1_00_000:
            return f"{sign}\u20b9{abs_v / 1_00_000:.2f} L"
        elif abs_v >= 1000:
            return f"{sign}\u20b9{abs_v / 1000:.1f}K"
        else:
            return f"{sign}\u20b9{abs_v:,.0f}"
    else:
        if v < 0:
            return f"-\u20b9{abs(v):,.0f}"
        return f"\u20b9{v:,.0f}"


def _fmt_pct(value: Optional[float]) -> str:
    """Format a percentage value."""
    if value is None:
        return "--"
    try:
        v = float(value)
    except (TypeError, ValueError):
        return "--"
    return f"{v:+.2f}%" if v != 0 else "0.00%"


def _fmt_pct_unsigned(value: Optional[float]) -> str:
    """Format a percentage without sign prefix."""
    if value is None:
        return "--"
    try:
        return f"{float(value):.2f}%"
    except (TypeError, ValueError):
        return "--"


def _safe_float(val: Any, default: float = 0.0) -> float:
    """Safely convert to float."""
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _member_color(idx: int) -> str:
    """Return the hex colour for a member at index *idx*."""
    return MEMBER_COLORS[idx % len(MEMBER_COLORS)]


# ---------------------------------------------------------------------------
# ParagraphStyle factory
# ---------------------------------------------------------------------------

def _style(
    name: str,
    font: str = "Helvetica",
    size: int = 10,
    color: str = INK,
    align: int = TA_LEFT,
    leading: Optional[int] = None,
    space_before: int = 0,
    space_after: int = 0,
    bold: bool = False,
    italic: bool = False,
    left_indent: int = 0,
    right_indent: int = 0,
    first_line_indent: int = 0,
) -> ParagraphStyle:
    """Convenience factory for ParagraphStyle."""
    if bold and italic:
        actual_font = font + "-BoldOblique" if font == "Helvetica" else font + "-BoldItalic"
    elif bold:
        actual_font = font + "-Bold"
    elif italic:
        actual_font = font + "-Oblique" if font == "Helvetica" else font + "-Italic"
    else:
        actual_font = font

    return ParagraphStyle(
        name,
        fontName=actual_font,
        fontSize=size,
        textColor=_hex(color),
        alignment=align,
        leading=leading or int(size * 1.35),
        spaceBefore=space_before,
        spaceAfter=space_after,
        leftIndent=left_indent,
        rightIndent=right_indent,
        firstLineIndent=first_line_indent,
    )


# ---------------------------------------------------------------------------
# Reusable paragraph styles
# ---------------------------------------------------------------------------

STYLE_HEADING1 = _style("H1", font="Georgia", size=18, color=NAVY, bold=True, space_after=6)
STYLE_HEADING2 = _style("H2", font="Georgia", size=14, color=NAVY, bold=True, space_before=8, space_after=4)
STYLE_HEADING3 = _style("H3", font="Georgia", size=12, color=NAVY, bold=True, space_before=6, space_after=3)
STYLE_BODY = _style("Body", size=9, leading=13, space_after=2)
STYLE_BODY_JUSTIFY = _style("BodyJ", size=9, leading=13, align=TA_JUSTIFY, space_after=2)
STYLE_BODY_SMALL = _style("BodyS", size=7.5, leading=10, color="#4B5563")
STYLE_BODY_CENTER = _style("BodyC", size=9, align=TA_CENTER)
STYLE_BODY_RIGHT = _style("BodyR", size=9, align=TA_RIGHT)
STYLE_LABEL = _style("Label", size=7, color="#6B7280", bold=True)
STYLE_KPI_VALUE = _style("KPIVal", font="Georgia", size=16, color=NAVY, bold=True, align=TA_CENTER)
STYLE_KPI_LABEL = _style("KPILbl", size=7.5, color="#6B7280", align=TA_CENTER, bold=True)
STYLE_DISCLAIMER = _style("Disclaim", size=7, color="#6B7280", leading=9, align=TA_JUSTIFY)
STYLE_FOOTER = _style("Footer", size=6.5, color="#9CA3AF", align=TA_CENTER)
STYLE_TABLE_HEADER = _style("TH", size=7.5, color=WHITE, bold=True, align=TA_CENTER)
STYLE_TABLE_HEADER_LEFT = _style("THL", size=7.5, color=WHITE, bold=True)
STYLE_TABLE_CELL = _style("TC", size=8, align=TA_CENTER, leading=11)
STYLE_TABLE_CELL_LEFT = _style("TCL", size=8, leading=11)
STYLE_TABLE_CELL_RIGHT = _style("TCR", size=8, align=TA_RIGHT, leading=11)
STYLE_COVER_TITLE = _style("CoverT", font="Georgia", size=28, color=WHITE, bold=True, align=TA_CENTER, leading=36)
STYLE_COVER_SUB = _style("CoverS", font="Georgia", size=14, color="#C7D2E8", align=TA_CENTER, leading=20)
STYLE_COVER_DETAIL = _style("CoverD", size=11, color="#E0E7FF", align=TA_CENTER)
STYLE_SECTION_TITLE = _style("SecT", font="Georgia", size=16, color=NAVY, bold=True, space_before=4, space_after=8)


# ---------------------------------------------------------------------------
# Reusable flowable builders
# ---------------------------------------------------------------------------

def _spacer(h: float = 6) -> Spacer:
    return Spacer(1, h)


def _hr(color: str = BORDER, width: float = CONTENT_W, thickness: float = 0.5) -> HRFlowable:
    return HRFlowable(
        width="100%",
        thickness=thickness,
        color=_hex(color),
        spaceBefore=3,
        spaceAfter=3,
    )


def _colored_strip(text: str, hex_color: str, width: float = CONTENT_W) -> Table:
    """A full-width coloured header strip with white text."""
    p = Paragraph(text, _style("strip", font="Georgia", size=12, color=WHITE, bold=True))
    t = Table([[p]], colWidths=[width], rowHeights=[28])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _hex(hex_color)),
                ("TEXTCOLOR", (0, 0), (-1, -1), _hex(WHITE)),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROUNDEDCORNERS", (0, 0), (-1, -1), [4, 4, 0, 0]),
            ]
        )
    )
    return t


def _kpi_card(label: str, value: str, accent: str = NAVY, width: float = 0) -> Table:
    """Single KPI card with top accent border."""
    if width <= 0:
        width = (CONTENT_W - 40) / 5
    v_para = Paragraph(value, _style("kv", font="Georgia", size=14, color=accent, bold=True, align=TA_CENTER))
    l_para = Paragraph(label, _style("kl", size=7, color="#6B7280", bold=True, align=TA_CENTER))
    inner = Table([[v_para], [l_para]], colWidths=[width - 8])
    inner.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (0, 0), 8),
                ("BOTTOMPADDING", (0, -1), (0, -1), 6),
            ]
        )
    )
    outer = Table([[inner]], colWidths=[width], rowHeights=[60])
    outer.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _hex(WHITE)),
                ("BOX", (0, 0), (-1, -1), 0.5, _hex(BORDER)),
                ("LINEABOVE", (0, 0), (-1, 0), 2.5, _hex(accent)),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return outer


def _action_badge(action: str) -> str:
    """Return an inline XML snippet for a coloured action badge."""
    action_upper = (action or "").upper().strip()
    clr = ACTION_COLORS.get(action_upper, AMBER)
    return (
        f'<font color="{WHITE}">'
        f'<b>&nbsp;{action_upper}&nbsp;</b>'
        f'</font>'
    )


def _action_badge_para(action: str) -> Paragraph:
    """Return a Paragraph containing a coloured action badge."""
    action_upper = (action or "").upper().strip()
    clr = ACTION_COLORS.get(action_upper, AMBER)
    style = _style(
        f"badge_{action_upper}",
        size=7,
        color=WHITE,
        bold=True,
        align=TA_CENTER,
    )
    style.backColor = _hex(clr)
    return Paragraph(f"&nbsp;{action_upper}&nbsp;", style)


# ---------------------------------------------------------------------------
# Page template callbacks (header + footer on every page)
# ---------------------------------------------------------------------------

def _header_footer(canvas, doc):
    """Draw header and footer on every page."""
    canvas.saveState()

    # Header line
    canvas.setStrokeColor(_hex(NAVY))
    canvas.setLineWidth(0.75)
    y_header = PAGE_H - 14 * mm
    canvas.line(MARGIN_LEFT, y_header, PAGE_W - MARGIN_RIGHT, y_header)

    # Header left text
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(_hex(NAVY))
    canvas.drawString(MARGIN_LEFT, y_header + 3, f"MeraSIP | {ARN}")

    # Header right — page number
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(_hex("#6B7280"))
    canvas.drawRightString(PAGE_W - MARGIN_RIGHT, y_header + 3, f"Page {doc.page}")

    # Footer line
    y_footer = MARGIN_BOTTOM - 6 * mm
    canvas.setStrokeColor(_hex(BORDER))
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_LEFT, y_footer, PAGE_W - MARGIN_RIGHT, y_footer)

    # Footer text
    canvas.setFont("Helvetica", 5.5)
    canvas.setFillColor(_hex("#9CA3AF"))
    canvas.drawCentredString(
        PAGE_W / 2,
        y_footer - 8,
        AMFI_DISCLAIMER_SHORT,
    )
    canvas.drawCentredString(
        PAGE_W / 2,
        y_footer - 16,
        f"{COMPANY_NAME}  |  {ARN}  |  EUIN: {EUIN}  |  {WEB}",
    )

    canvas.restoreState()


def _header_footer_cover(canvas, doc):
    """No header/footer on the cover page."""
    pass


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _build_cover(data: dict) -> list:
    """Page 1: Cover page with navy background."""
    elements: list = []
    group_name = data.get("group_name", "Family Portfolio")
    subtitle = data.get("group_subtitle", "Consolidated Mutual Fund Portfolio Review")
    report_date = data.get("report_date", "")
    sensex = data.get("sensex", "")
    members = data.get("members", [])
    member_count = len(members)

    # Navy background table that fills the page
    cover_lines = []
    cover_lines.append(Spacer(1, 80))

    # Brand
    cover_lines.append(
        Paragraph("MeraSIP", _style("cb", font="Georgia", size=14, color="#C7D2E8", align=TA_CENTER, bold=True))
    )
    cover_lines.append(Spacer(1, 4))
    cover_lines.append(
        Paragraph("by Trustner", _style("cb2", font="Georgia", size=10, color="#A3B8DB", align=TA_CENTER, italic=True))
    )
    cover_lines.append(Spacer(1, 40))

    # Decorative line
    cover_lines.append(
        HRFlowable(width="40%", thickness=1, color=_hex("#4A72A8"), spaceBefore=0, spaceAfter=20)
    )

    # Title
    cover_lines.append(
        Paragraph("Family S.M.A.R.T", STYLE_COVER_TITLE)
    )
    cover_lines.append(
        Paragraph("Portfolio Review", _style("ct2", font="Georgia", size=24, color="#E0E7FF", bold=True, align=TA_CENTER, leading=32))
    )
    cover_lines.append(Spacer(1, 20))

    cover_lines.append(
        HRFlowable(width="40%", thickness=1, color=_hex("#4A72A8"), spaceBefore=0, spaceAfter=20)
    )

    # Group name
    cover_lines.append(
        Paragraph(group_name, _style("cgn", font="Georgia", size=20, color=WHITE, bold=True, align=TA_CENTER))
    )
    cover_lines.append(Spacer(1, 6))
    cover_lines.append(
        Paragraph(subtitle, STYLE_COVER_SUB)
    )
    cover_lines.append(Spacer(1, 40))

    # Details row
    detail_items = []
    if report_date:
        detail_items.append(f"Report Date: {report_date}")
    if member_count:
        detail_items.append(f"Members: {member_count}")
    if sensex:
        detail_items.append(f"Sensex: {sensex}")

    for item in detail_items:
        cover_lines.append(Paragraph(item, STYLE_COVER_DETAIL))
        cover_lines.append(Spacer(1, 4))

    cover_lines.append(Spacer(1, 50))

    # ARN
    cover_lines.append(
        Paragraph(ARN, _style("carn", size=10, color="#A3B8DB", align=TA_CENTER, bold=True))
    )
    cover_lines.append(Spacer(1, 4))
    cover_lines.append(
        Paragraph(COMPANY_NAME, _style("ccn", size=8, color="#8899BB", align=TA_CENTER))
    )

    # Build the cover as a full-page navy table
    inner_flow = []
    for el in cover_lines:
        inner_flow.append(el)

    cover_cell = Table(
        [[inner_flow]],
        colWidths=[CONTENT_W],
        rowHeights=[PAGE_H - MARGIN_TOP - MARGIN_BOTTOM],
    )
    cover_cell.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _hex(NAVY)),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 20),
                ("RIGHTPADDING", (0, 0), (-1, -1), 20),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("ROUNDEDCORNERS", (0, 0), (-1, -1), [6, 6, 6, 6]),
            ]
        )
    )
    elements.append(cover_cell)
    elements.append(PageBreak())
    return elements


def _build_disclaimer() -> list:
    """Page 2: Disclaimer and compliance page."""
    elements: list = []

    elements.append(Paragraph("Important Disclosures & Disclaimers", STYLE_HEADING1))
    elements.append(_hr(NAVY, thickness=1))
    elements.append(_spacer(10))

    disclaimer_texts = [
        (
            "AMFI Compliance",
            "Mutual Fund investments are subject to market risks. Read all scheme-related "
            "documents carefully before investing. Past performance is not indicative of future "
            "returns. The NAVs of the schemes may go up or down depending upon the factors and "
            "forces affecting the securities market including fluctuations in the interest rates."
        ),
        (
            "Distributor Disclosure",
            f"This report is prepared by {COMPANY_NAME} ({ARN}), "
            f"a registered mutual fund distributor. EUIN: {EUIN}. "
            "The distributor earns commission from the Asset Management Companies (AMCs) "
            "for the mutual fund schemes distributed. The commission structure varies across "
            "AMCs and schemes. Investors are advised to check the commission disclosure on "
            "the AMC website or the distributor's website before investing."
        ),
        (
            "Investment Advisory",
            "This document is for informational purposes only and should not be construed as "
            "investment advice. The information contained herein is based on data obtained from "
            "sources believed to be reliable. However, the accuracy or completeness of such "
            "information is not guaranteed. Investors should consult their financial advisors "
            "before making any investment decisions."
        ),
        (
            "Returns & Performance",
            "Returns mentioned in this report are based on NAV data available as of the report "
            "date. XIRR (Extended Internal Rate of Return) is calculated based on actual "
            "transaction dates and amounts. Absolute returns are simple point-to-point returns. "
            "Past performance may or may not be sustained in the future."
        ),
        (
            "Portfolio Recommendations",
            "Any recommendations or action items mentioned in this report (HOLD, SWITCH, REVIEW, "
            "ADD, EXIT) are based on the distributor's assessment of the investor's risk profile, "
            "investment horizon, and current market conditions. These are suggestions and not "
            "directives. The final investment decision rests with the investor."
        ),
        (
            "Risk Factors",
            "Different categories of mutual funds carry different levels of risk. Equity funds "
            "are subject to higher volatility compared to debt funds. Small cap and mid cap funds "
            "carry higher risk than large cap funds. Sector/thematic funds are concentrated and "
            "carry higher risk. Investors should invest according to their risk appetite and "
            "investment horizon."
        ),
        (
            "Tax Implications",
            "Tax implications of mutual fund investments depend on the type of scheme, holding "
            "period, and the investor's tax bracket. Investors are advised to consult their tax "
            "advisors for specific tax-related queries. The distributor does not provide tax advice."
        ),
        (
            "Regulatory Compliance",
            f"CIN: {CIN}. Registered Office: {ADDRESS}. "
            f"Contact: {EMAIL} | {PHONE}. "
            "This document is intended solely for the addressee and may contain confidential "
            "information. If you are not the intended recipient, please notify the sender "
            "immediately and destroy this document."
        ),
    ]

    for heading, body in disclaimer_texts:
        elements.append(
            Paragraph(heading, _style("dh", font="Georgia", size=10, color=NAVY, bold=True, space_before=8, space_after=2))
        )
        elements.append(Paragraph(body, STYLE_BODY_JUSTIFY))
        elements.append(_spacer(4))

    elements.append(PageBreak())
    return elements


def _build_family_dashboard(data: dict) -> list:
    """Page 3: Family Summary Dashboard with KPI cards and member table."""
    elements: list = []
    members = data.get("members", [])

    elements.append(Paragraph("Family Summary Dashboard", STYLE_SECTION_TITLE))
    elements.append(_hr(NAVY, thickness=1))
    elements.append(_spacer(8))

    # Aggregate KPIs
    total_inv = sum(_safe_float(m.get("inv")) for m in members)
    total_val = sum(_safe_float(m.get("val")) for m in members)
    total_gain = total_val - total_inv
    member_count = len(members)

    # Weighted average XIRR (by invested amount)
    xirr_num = sum(_safe_float(m.get("xirr")) * _safe_float(m.get("inv")) for m in members)
    xirr_den = total_inv if total_inv > 0 else 1
    avg_xirr = xirr_num / xirr_den

    # KPI cards row
    card_w = (CONTENT_W - 32) / 5
    kpi_row = [
        _kpi_card("Total Invested", _fmt_inr(total_inv, short=True), NAVY, card_w),
        _kpi_card("Current Value", _fmt_inr(total_val, short=True), NAVY_DIM, card_w),
        _kpi_card("Total Gain", _fmt_inr(total_gain, short=True), EMERALD if total_gain >= 0 else CRIMSON, card_w),
        _kpi_card("Avg XIRR", _fmt_pct_unsigned(avg_xirr), EMERALD if avg_xirr >= 0 else CRIMSON, card_w),
        _kpi_card("Members", str(member_count), VIOLET, card_w),
    ]

    kpi_table = Table([kpi_row], colWidths=[card_w] * 5)
    kpi_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(kpi_table)
    elements.append(_spacer(16))

    # Total SIP
    total_sip = sum(_safe_float(m.get("sip_monthly")) for m in members)
    if total_sip > 0:
        elements.append(
            Paragraph(
                f"Total Family SIP: <b>{_fmt_inr(total_sip, short=True)}/month</b>",
                _style("sip", size=10, color=NAVY, align=TA_CENTER),
            )
        )
        elements.append(_spacer(12))

    # Member comparison table
    elements.append(Paragraph("Member-wise Breakdown", STYLE_HEADING2))
    elements.append(_spacer(4))

    headers = [
        Paragraph("Member", STYLE_TABLE_HEADER_LEFT),
        Paragraph("PAN", STYLE_TABLE_HEADER),
        Paragraph("Risk Profile", STYLE_TABLE_HEADER),
        Paragraph("Invested", STYLE_TABLE_HEADER),
        Paragraph("Value", STYLE_TABLE_HEADER),
        Paragraph("Gain", STYLE_TABLE_HEADER),
        Paragraph("XIRR", STYLE_TABLE_HEADER),
    ]

    col_widths = [
        CONTENT_W * 0.22,
        CONTENT_W * 0.13,
        CONTENT_W * 0.13,
        CONTENT_W * 0.14,
        CONTENT_W * 0.14,
        CONTENT_W * 0.12,
        CONTENT_W * 0.12,
    ]

    table_data = [headers]

    for i, m in enumerate(members):
        inv = _safe_float(m.get("inv"))
        val = _safe_float(m.get("val"))
        gain = _safe_float(m.get("gain", val - inv))
        xirr_val = m.get("xirr")
        gain_color = EMERALD if gain >= 0 else CRIMSON
        xirr_color = EMERALD if _safe_float(xirr_val) >= 0 else CRIMSON

        mc = _member_color(i)
        name_style = _style(f"mn{i}", size=8, color=mc, bold=True)
        row = [
            Paragraph(m.get("name", f"Member {i+1}"), name_style),
            Paragraph(m.get("pan", "--"), STYLE_TABLE_CELL),
            Paragraph(m.get("risk_profile", "--"), STYLE_TABLE_CELL),
            Paragraph(_fmt_inr(inv, short=True), STYLE_TABLE_CELL),
            Paragraph(_fmt_inr(val, short=True), STYLE_TABLE_CELL),
            Paragraph(
                _fmt_inr(gain, short=True),
                _style(f"mg{i}", size=8, color=gain_color, align=TA_CENTER),
            ),
            Paragraph(
                _fmt_pct_unsigned(xirr_val),
                _style(f"mx{i}", size=8, color=xirr_color, bold=True, align=TA_CENTER),
            ),
        ]
        table_data.append(row)

    # Totals row
    total_gain_color = EMERALD if total_gain >= 0 else CRIMSON
    avg_xirr_color = EMERALD if avg_xirr >= 0 else CRIMSON
    totals = [
        Paragraph("<b>TOTAL</b>", _style("tot", size=8, color=NAVY, bold=True)),
        Paragraph("", STYLE_TABLE_CELL),
        Paragraph("", STYLE_TABLE_CELL),
        Paragraph(f"<b>{_fmt_inr(total_inv, short=True)}</b>", _style("ti", size=8, color=NAVY, bold=True, align=TA_CENTER)),
        Paragraph(f"<b>{_fmt_inr(total_val, short=True)}</b>", _style("tv", size=8, color=NAVY, bold=True, align=TA_CENTER)),
        Paragraph(
            f"<b>{_fmt_inr(total_gain, short=True)}</b>",
            _style("tg", size=8, color=total_gain_color, bold=True, align=TA_CENTER),
        ),
        Paragraph(
            f"<b>{_fmt_pct_unsigned(avg_xirr)}</b>",
            _style("tx", size=8, color=avg_xirr_color, bold=True, align=TA_CENTER),
        ),
    ]
    table_data.append(totals)

    tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _hex(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex(WHITE)),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.5, _hex(BORDER)),
        # Totals row
        ("BACKGROUND", (0, -1), (-1, -1), _hex(NAVY_PALE)),
        ("LINEABOVE", (0, -1), (-1, -1), 1, _hex(NAVY)),
    ]

    # Alternate row shading
    for row_idx in range(1, len(table_data) - 1):
        if row_idx % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, row_idx), (-1, row_idx), _hex(BG)))

    tbl.setStyle(TableStyle(style_cmds))
    elements.append(tbl)
    elements.append(PageBreak())
    return elements


def _build_member_bar_chart(data: dict) -> list:
    """Page 4: Horizontal bar chart comparing member portfolio values."""
    elements: list = []
    members = data.get("members", [])

    if not members:
        return elements

    elements.append(Paragraph("Member Portfolio Comparison", STYLE_SECTION_TITLE))
    elements.append(_hr(NAVY, thickness=1))
    elements.append(_spacer(10))

    # Chart dimensions
    chart_w = CONTENT_W - 20
    bar_height = 28
    gap = 14
    label_w = 120
    chart_area_w = chart_w - label_w - 80  # space for value labels on right
    chart_h = len(members) * (bar_height + gap) + 40

    max_val = max(_safe_float(m.get("val", 0)) for m in members) or 1

    d = Drawing(chart_w, chart_h)

    # Background
    d.add(Rect(0, 0, chart_w, chart_h, fillColor=_hex_alpha(BG, 0.5), strokeColor=None))

    # Title inside drawing
    d.add(
        String(
            chart_w / 2, chart_h - 14, "Current Value by Member",
            fontSize=10, fontName="Georgia-Bold", fillColor=_hex(NAVY),
            textAnchor="middle",
        )
    )

    y_start = chart_h - 40

    for i, m in enumerate(members):
        y = y_start - i * (bar_height + gap)
        val = _safe_float(m.get("val", 0))
        bar_w = (val / max_val) * chart_area_w if max_val > 0 else 0
        mc = _hex(_member_color(i))

        # Member name label
        name = m.get("name", f"Member {i+1}")
        if len(name) > 18:
            name = name[:16] + ".."
        d.add(
            String(
                label_w - 8, y + bar_height / 2 - 4, name,
                fontSize=8, fontName="Helvetica-Bold", fillColor=mc,
                textAnchor="end",
            )
        )

        # Bar
        d.add(
            Rect(
                label_w, y, bar_w, bar_height,
                fillColor=mc, strokeColor=None,
                rx=3, ry=3,
            )
        )

        # Value label
        d.add(
            String(
                label_w + bar_w + 6, y + bar_height / 2 - 4,
                _fmt_inr(val, short=True),
                fontSize=8, fontName="Helvetica-Bold", fillColor=_hex(INK),
            )
        )

        # XIRR label under bar
        xirr_val = m.get("xirr")
        if xirr_val is not None:
            xirr_color = _hex(EMERALD) if _safe_float(xirr_val) >= 0 else _hex(CRIMSON)
            d.add(
                String(
                    label_w, y - 10,
                    f"XIRR: {_fmt_pct_unsigned(xirr_val)}",
                    fontSize=6.5, fontName="Helvetica", fillColor=xirr_color,
                )
            )

    # Invested vs Value legend
    legend_y = 10
    d.add(Rect(chart_w - 180, legend_y, 10, 10, fillColor=_hex(NAVY), strokeColor=None))
    d.add(String(chart_w - 166, legend_y + 1, "Current Value", fontSize=7, fontName="Helvetica", fillColor=_hex(INK)))

    elements.append(d)
    elements.append(_spacer(12))

    # Invested comparison bars
    elements.append(Paragraph("Invested Amount by Member", STYLE_HEADING3))
    elements.append(_spacer(6))

    max_inv = max(_safe_float(m.get("inv", 0)) for m in members) or 1
    chart_h2 = len(members) * (bar_height + gap) + 20

    d2 = Drawing(chart_w, chart_h2)
    d2.add(Rect(0, 0, chart_w, chart_h2, fillColor=_hex_alpha(BG, 0.5), strokeColor=None))

    y_start2 = chart_h2 - 20

    for i, m in enumerate(members):
        y = y_start2 - i * (bar_height + gap)
        inv = _safe_float(m.get("inv", 0))
        bar_w = (inv / max_inv) * chart_area_w if max_inv > 0 else 0
        mc = _hex_alpha(_member_color(i), 0.55)

        name = m.get("name", f"Member {i+1}")
        if len(name) > 18:
            name = name[:16] + ".."
        d2.add(
            String(
                label_w - 8, y + bar_height / 2 - 4, name,
                fontSize=8, fontName="Helvetica-Bold", fillColor=_hex(_member_color(i)),
                textAnchor="end",
            )
        )
        d2.add(
            Rect(label_w, y, bar_w, bar_height, fillColor=mc, strokeColor=None, rx=3, ry=3)
        )
        d2.add(
            String(
                label_w + bar_w + 6, y + bar_height / 2 - 4,
                _fmt_inr(inv, short=True),
                fontSize=8, fontName="Helvetica-Bold", fillColor=_hex(INK),
            )
        )

    elements.append(d2)
    elements.append(PageBreak())
    return elements


def _build_member_section(member: dict, idx: int) -> list:
    """Build 2-3 pages for a single member: header, KPIs, fund table, advice."""
    elements: list = []
    mc = _member_color(idx)
    name = member.get("name", f"Member {idx + 1}")
    pan = member.get("pan", "--")
    m_type = member.get("type", "--")
    relation = member.get("relation", "")
    risk = member.get("risk_profile", "--")
    sip = _safe_float(member.get("sip_monthly"))
    folio = member.get("folio_id", "")
    age_band = member.get("age_band", "")
    horizon = member.get("horizon", "")

    # --- Member header strip ---
    elements.append(_colored_strip(f"  {name}", mc))
    elements.append(_spacer(6))

    # Info row
    info_items = []
    if pan and pan != "--":
        info_items.append(f"<b>PAN:</b> {pan}")
    if folio:
        info_items.append(f"<b>Folio:</b> {folio}")
    if m_type and m_type != "--":
        info_items.append(f"<b>Type:</b> {m_type}")
    if relation:
        info_items.append(f"<b>Relation:</b> {relation}")
    if risk and risk != "--":
        info_items.append(f"<b>Risk:</b> {risk}")
    if age_band:
        info_items.append(f"<b>Age:</b> {age_band}")
    if horizon:
        info_items.append(f"<b>Horizon:</b> {horizon}")

    info_text = "&nbsp;&nbsp;|&nbsp;&nbsp;".join(info_items)
    elements.append(Paragraph(info_text, _style("mi", size=8, color="#4B5563", leading=12)))
    elements.append(_spacer(10))

    # --- Member KPI cards ---
    inv = _safe_float(member.get("inv"))
    val = _safe_float(member.get("val"))
    gain = _safe_float(member.get("gain", val - inv))
    abs_ret = member.get("abs_return")
    xirr_val = member.get("xirr")

    card_w = (CONTENT_W - 32) / 5
    kpi_row = [
        _kpi_card("Invested", _fmt_inr(inv, short=True), mc, card_w),
        _kpi_card("Current Value", _fmt_inr(val, short=True), NAVY_DIM, card_w),
        _kpi_card(
            "Gain / Loss",
            _fmt_inr(gain, short=True),
            EMERALD if gain >= 0 else CRIMSON,
            card_w,
        ),
        _kpi_card(
            "Abs. Return",
            _fmt_pct_unsigned(abs_ret),
            EMERALD if _safe_float(abs_ret) >= 0 else CRIMSON,
            card_w,
        ),
        _kpi_card(
            "XIRR",
            _fmt_pct_unsigned(xirr_val) if xirr_val is not None else "--",
            EMERALD if _safe_float(xirr_val) >= 0 else CRIMSON,
            card_w,
        ),
    ]

    kpi_table = Table([kpi_row], colWidths=[card_w] * 5)
    kpi_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(kpi_table)

    if sip > 0:
        elements.append(_spacer(6))
        elements.append(
            Paragraph(
                f"Monthly SIP: <b>{_fmt_inr(sip, short=True)}</b>",
                _style("msip", size=9, color=mc, align=TA_LEFT, bold=False),
            )
        )

    elements.append(_spacer(12))

    # --- Fund table ---
    funds = member.get("funds", [])
    if funds:
        elements.append(Paragraph("Fund Holdings", STYLE_HEADING3))
        elements.append(_spacer(4))

        fund_headers = [
            Paragraph("Fund Name", STYLE_TABLE_HEADER_LEFT),
            Paragraph("Category", STYLE_TABLE_HEADER),
            Paragraph("Invested", STYLE_TABLE_HEADER),
            Paragraph("Value", STYLE_TABLE_HEADER),
            Paragraph("Abs %", STYLE_TABLE_HEADER),
            Paragraph("XIRR %", STYLE_TABLE_HEADER),
            Paragraph("Action", STYLE_TABLE_HEADER),
            Paragraph("Since", STYLE_TABLE_HEADER),
        ]

        fund_col_w = [
            CONTENT_W * 0.26,
            CONTENT_W * 0.12,
            CONTENT_W * 0.12,
            CONTENT_W * 0.12,
            CONTENT_W * 0.09,
            CONTENT_W * 0.09,
            CONTENT_W * 0.10,
            CONTENT_W * 0.10,
        ]

        fund_rows = [fund_headers]

        for f in funds:
            f_abs = f.get("abs")
            f_xirr = f.get("xirr")
            f_abs_color = EMERALD if _safe_float(f_abs) >= 0 else CRIMSON
            f_xirr_color = EMERALD if _safe_float(f_xirr) >= 0 else CRIMSON
            action = (f.get("action") or "").upper().strip()

            fund_name = f.get("name", "--")
            # Truncate long names for table
            display_name = fund_name if len(fund_name) <= 35 else fund_name[:33] + ".."

            row = [
                Paragraph(display_name, _style("fn", size=7.5, leading=10)),
                Paragraph(f.get("cat", "--"), _style("fc", size=7.5, align=TA_CENTER)),
                Paragraph(_fmt_inr(f.get("inv"), short=True), STYLE_TABLE_CELL),
                Paragraph(_fmt_inr(f.get("val"), short=True), STYLE_TABLE_CELL),
                Paragraph(
                    _fmt_pct(f_abs),
                    _style("fa", size=7.5, color=f_abs_color, align=TA_CENTER),
                ),
                Paragraph(
                    _fmt_pct_unsigned(f_xirr),
                    _style("fx", size=7.5, color=f_xirr_color, bold=True, align=TA_CENTER),
                ),
                _action_badge_para(action),
                Paragraph(str(f.get("since", "--")), _style("fs", size=7.5, align=TA_CENTER)),
            ]
            fund_rows.append(row)

        # Fund totals
        fund_total_inv = sum(_safe_float(f_.get("inv")) for f_ in funds)
        fund_total_val = sum(_safe_float(f_.get("val")) for f_ in funds)
        fund_total_gain = fund_total_val - fund_total_inv
        fund_total_abs = (fund_total_gain / fund_total_inv * 100) if fund_total_inv > 0 else 0

        totals_row = [
            Paragraph("<b>TOTAL</b>", _style("ftt", size=7.5, color=NAVY, bold=True)),
            Paragraph("", STYLE_TABLE_CELL),
            Paragraph(f"<b>{_fmt_inr(fund_total_inv, short=True)}</b>", _style("fti", size=7.5, color=NAVY, bold=True, align=TA_CENTER)),
            Paragraph(f"<b>{_fmt_inr(fund_total_val, short=True)}</b>", _style("ftv", size=7.5, color=NAVY, bold=True, align=TA_CENTER)),
            Paragraph(
                f"<b>{_fmt_pct_unsigned(fund_total_abs)}</b>",
                _style("fta", size=7.5, color=EMERALD if fund_total_abs >= 0 else CRIMSON, bold=True, align=TA_CENTER),
            ),
            Paragraph("", STYLE_TABLE_CELL),
            Paragraph("", STYLE_TABLE_CELL),
            Paragraph("", STYLE_TABLE_CELL),
        ]
        fund_rows.append(totals_row)

        ftbl = Table(fund_rows, colWidths=fund_col_w, repeatRows=1)
        fstyle = [
            ("BACKGROUND", (0, 0), (-1, 0), _hex(mc)),
            ("TEXTCOLOR", (0, 0), (-1, 0), _hex(WHITE)),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("GRID", (0, 0), (-1, -1), 0.4, _hex(BORDER)),
            # Totals row
            ("BACKGROUND", (0, -1), (-1, -1), _hex(NAVY_PALE)),
            ("LINEABOVE", (0, -1), (-1, -1), 0.8, _hex(mc)),
        ]
        for row_idx in range(1, len(fund_rows) - 1):
            if row_idx % 2 == 0:
                fstyle.append(("BACKGROUND", (0, row_idx), (-1, row_idx), _hex(BG)))

        ftbl.setStyle(TableStyle(fstyle))
        elements.append(ftbl)
    else:
        elements.append(
            Paragraph(
                "<i>No fund holdings data available for this member.</i>",
                _style("nf", size=9, color="#6B7280", italic=True),
            )
        )

    elements.append(_spacer(12))

    # --- Advice section ---
    advice_list = member.get("advice", [])
    if advice_list:
        elements.append(Paragraph("Advisor Notes & Action Items", STYLE_HEADING3))
        elements.append(_spacer(4))

        for adv in advice_list:
            if not adv or not isinstance(adv, (list, tuple)) or len(adv) < 3:
                continue

            title = adv[0]
            action_type = (adv[1] or "").upper().strip()
            description = adv[2]
            action_clr = ACTION_COLORS.get(action_type, AMBER)

            # Advice card
            title_para = Paragraph(
                f'<b>{title}</b>',
                _style("at", size=9, color=action_clr, bold=True, space_after=2),
            )
            desc_para = Paragraph(
                description,
                _style("ad", size=8, color=INK, leading=12, space_after=2),
            )

            advice_inner = Table(
                [[title_para], [desc_para]],
                colWidths=[CONTENT_W - 16],
            )
            advice_inner.setStyle(
                TableStyle(
                    [
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (0, 0), 6),
                        ("BOTTOMPADDING", (0, -1), (0, -1), 6),
                        ("LINEBELOW", (0, 0), (-1, 0), 0, _hex(WHITE)),
                    ]
                )
            )

            advice_card = Table(
                [[advice_inner]],
                colWidths=[CONTENT_W - 8],
            )
            advice_card.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), _hex(WHITE)),
                        ("BOX", (0, 0), (-1, -1), 0.5, _hex(BORDER)),
                        ("LINEBEFORE", (0, 0), (0, -1), 3, _hex(action_clr)),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ]
                )
            )

            elements.append(KeepTogether([advice_card, _spacer(6)]))

    elements.append(PageBreak())
    return elements


def _build_category_distribution(data: dict) -> list:
    """Consolidated Category Distribution page."""
    elements: list = []
    members = data.get("members", [])

    elements.append(Paragraph("Consolidated Category Distribution", STYLE_SECTION_TITLE))
    elements.append(_hr(NAVY, thickness=1))
    elements.append(_spacer(8))

    elements.append(
        Paragraph(
            "Aggregated view of all fund holdings across family members, grouped by fund category.",
            STYLE_BODY,
        )
    )
    elements.append(_spacer(8))

    # Aggregate by category
    cat_data: Dict[str, Dict[str, float]] = {}
    total_family_val = 0.0

    for m in members:
        for f in m.get("funds", []):
            cat = f.get("cat", "Other")
            inv = _safe_float(f.get("inv"))
            val = _safe_float(f.get("val"))
            if cat not in cat_data:
                cat_data[cat] = {"inv": 0.0, "val": 0.0, "count": 0}
            cat_data[cat]["inv"] += inv
            cat_data[cat]["val"] += val
            cat_data[cat]["count"] += 1
            total_family_val += val

    if not cat_data:
        elements.append(Paragraph("<i>No fund data available.</i>", STYLE_BODY))
        elements.append(PageBreak())
        return elements

    # Sort by value descending
    sorted_cats = sorted(cat_data.items(), key=lambda x: x[1]["val"], reverse=True)

    headers = [
        Paragraph("Category", STYLE_TABLE_HEADER_LEFT),
        Paragraph("Funds", STYLE_TABLE_HEADER),
        Paragraph("Invested", STYLE_TABLE_HEADER),
        Paragraph("Current Value", STYLE_TABLE_HEADER),
        Paragraph("Gain", STYLE_TABLE_HEADER),
        Paragraph("Allocation %", STYLE_TABLE_HEADER),
    ]

    col_w = [
        CONTENT_W * 0.24,
        CONTENT_W * 0.10,
        CONTENT_W * 0.18,
        CONTENT_W * 0.18,
        CONTENT_W * 0.16,
        CONTENT_W * 0.14,
    ]

    rows = [headers]
    grand_inv = 0.0
    grand_val = 0.0

    cat_colors = [NAVY, EMERALD, CRIMSON, VIOLET, AMBER, NAVY_DIM, "#374151", "#065F46"]

    for ci, (cat, cdata) in enumerate(sorted_cats):
        c_inv = cdata["inv"]
        c_val = cdata["val"]
        c_gain = c_val - c_inv
        c_alloc = (c_val / total_family_val * 100) if total_family_val > 0 else 0
        grand_inv += c_inv
        grand_val += c_val

        cc = cat_colors[ci % len(cat_colors)]
        gain_clr = EMERALD if c_gain >= 0 else CRIMSON

        row = [
            Paragraph(f'<b>{cat}</b>', _style(f"cc{ci}", size=8, color=cc, bold=True)),
            Paragraph(str(int(cdata["count"])), STYLE_TABLE_CELL),
            Paragraph(_fmt_inr(c_inv, short=True), STYLE_TABLE_CELL),
            Paragraph(_fmt_inr(c_val, short=True), STYLE_TABLE_CELL),
            Paragraph(
                _fmt_inr(c_gain, short=True),
                _style(f"cg{ci}", size=8, color=gain_clr, align=TA_CENTER),
            ),
            Paragraph(f"{c_alloc:.1f}%", _style(f"ca{ci}", size=8, color=NAVY, bold=True, align=TA_CENTER)),
        ]
        rows.append(row)

    grand_gain = grand_val - grand_inv
    grand_gain_clr = EMERALD if grand_gain >= 0 else CRIMSON

    totals_row = [
        Paragraph("<b>TOTAL</b>", _style("ctt", size=8, color=NAVY, bold=True)),
        Paragraph(
            str(sum(int(c["count"]) for c in cat_data.values())),
            _style("ctc", size=8, color=NAVY, bold=True, align=TA_CENTER),
        ),
        Paragraph(f"<b>{_fmt_inr(grand_inv, short=True)}</b>", _style("cti", size=8, color=NAVY, bold=True, align=TA_CENTER)),
        Paragraph(f"<b>{_fmt_inr(grand_val, short=True)}</b>", _style("ctv", size=8, color=NAVY, bold=True, align=TA_CENTER)),
        Paragraph(
            f"<b>{_fmt_inr(grand_gain, short=True)}</b>",
            _style("ctg", size=8, color=grand_gain_clr, bold=True, align=TA_CENTER),
        ),
        Paragraph("<b>100.0%</b>", _style("cta", size=8, color=NAVY, bold=True, align=TA_CENTER)),
    ]
    rows.append(totals_row)

    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _hex(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex(WHITE)),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.5, _hex(BORDER)),
        ("BACKGROUND", (0, -1), (-1, -1), _hex(NAVY_PALE)),
        ("LINEABOVE", (0, -1), (-1, -1), 1, _hex(NAVY)),
    ]
    for row_idx in range(1, len(rows) - 1):
        if row_idx % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, row_idx), (-1, row_idx), _hex(BG)))

    tbl.setStyle(TableStyle(style_cmds))
    elements.append(tbl)
    elements.append(_spacer(14))

    # Visual bar for allocation
    elements.append(Paragraph("Visual Allocation Breakdown", STYLE_HEADING3))
    elements.append(_spacer(6))

    bar_w = CONTENT_W - 20
    bar_h = 30
    d = Drawing(bar_w + 20, bar_h + 60)

    # Background
    d.add(Rect(0, 20, bar_w + 20, bar_h, fillColor=_hex_alpha(BG, 0.3), strokeColor=_hex(BORDER), strokeWidth=0.5))

    x_offset = 10
    for ci, (cat, cdata) in enumerate(sorted_cats):
        alloc_pct = (cdata["val"] / total_family_val) if total_family_val > 0 else 0
        seg_w = alloc_pct * bar_w
        if seg_w < 1:
            continue

        cc = _hex(cat_colors[ci % len(cat_colors)])
        d.add(Rect(x_offset, 22, seg_w, bar_h - 4, fillColor=cc, strokeColor=None))

        # Label if wide enough
        if seg_w > 35:
            label_text = f"{alloc_pct * 100:.0f}%"
            d.add(
                String(
                    x_offset + seg_w / 2, 22 + bar_h / 2 - 5, label_text,
                    fontSize=7, fontName="Helvetica-Bold", fillColor=_hex(WHITE),
                    textAnchor="middle",
                )
            )

        x_offset += seg_w

    # Legend below
    legend_x = 10
    legend_y = 6
    for ci, (cat, _) in enumerate(sorted_cats):
        cc = _hex(cat_colors[ci % len(cat_colors)])
        d.add(Rect(legend_x, legend_y, 8, 8, fillColor=cc, strokeColor=None))
        d.add(
            String(
                legend_x + 11, legend_y + 1, cat,
                fontSize=6, fontName="Helvetica", fillColor=_hex(INK),
            )
        )
        legend_x += max(len(cat) * 5 + 20, 50)
        if legend_x > bar_w - 30:
            break

    elements.append(d)
    elements.append(PageBreak())
    return elements


def _build_rebalancing_plan(data: dict) -> list:
    """Family Rebalancing Plan: all SWITCH/REVIEW actions across members."""
    elements: list = []
    members = data.get("members", [])

    elements.append(Paragraph("Family Rebalancing Plan", STYLE_SECTION_TITLE))
    elements.append(_hr(NAVY, thickness=1))
    elements.append(_spacer(8))

    elements.append(
        Paragraph(
            "Consolidated list of all recommended portfolio actions across family members. "
            "Actions are prioritized by urgency: SWITCH (immediate) > REVIEW (near-term) > ADD/EXIT.",
            STYLE_BODY,
        )
    )
    elements.append(_spacer(10))

    # Gather all action items
    action_items: list = []

    for i, m in enumerate(members):
        member_name = m.get("name", f"Member {i+1}")
        mc = _member_color(i)

        # From advice
        for adv in m.get("advice", []):
            if not adv or not isinstance(adv, (list, tuple)) or len(adv) < 3:
                continue
            action_type = (adv[1] or "").upper().strip()
            if action_type in ("SWITCH", "REVIEW", "EXIT", "ADD"):
                action_items.append({
                    "member": member_name,
                    "member_color": mc,
                    "action": action_type,
                    "title": adv[0],
                    "detail": adv[2],
                    "priority": {"SWITCH": 1, "EXIT": 2, "REVIEW": 3, "ADD": 4}.get(action_type, 5),
                })

        # Also check funds with non-HOLD actions
        for f in m.get("funds", []):
            action = (f.get("action") or "").upper().strip()
            if action in ("SWITCH", "REVIEW", "EXIT"):
                # Avoid duplicates if already in advice
                already = any(
                    ai["member"] == member_name and f.get("name", "") in ai.get("detail", "")
                    for ai in action_items
                )
                if not already:
                    action_items.append({
                        "member": member_name,
                        "member_color": mc,
                        "action": action,
                        "title": f.get("name", "Unknown Fund"),
                        "detail": f"Category: {f.get('cat', '--')} | XIRR: {_fmt_pct_unsigned(f.get('xirr'))} | Action: {action}",
                        "priority": {"SWITCH": 1, "EXIT": 2, "REVIEW": 3}.get(action, 5),
                    })

    # Sort by priority
    action_items.sort(key=lambda x: x["priority"])

    if not action_items:
        elements.append(
            Paragraph(
                "<i>No rebalancing actions pending. All portfolios are aligned.</i>",
                _style("nra", size=10, color=EMERALD, italic=True),
            )
        )
        elements.append(PageBreak())
        return elements

    # Summary counts
    switch_count = sum(1 for a in action_items if a["action"] == "SWITCH")
    review_count = sum(1 for a in action_items if a["action"] == "REVIEW")
    other_count = len(action_items) - switch_count - review_count

    summary_text = []
    if switch_count:
        summary_text.append(f'<font color="{CRIMSON}"><b>{switch_count} SWITCH</b></font>')
    if review_count:
        summary_text.append(f'<font color="{AMBER}"><b>{review_count} REVIEW</b></font>')
    if other_count:
        summary_text.append(f'<font color="{VIOLET}"><b>{other_count} OTHER</b></font>')

    elements.append(
        Paragraph(
            f"Total Actions: {len(action_items)} &mdash; " + " | ".join(summary_text),
            _style("ras", size=10, color=NAVY),
        )
    )
    elements.append(_spacer(10))

    # Action table
    headers = [
        Paragraph("#", STYLE_TABLE_HEADER),
        Paragraph("Member", STYLE_TABLE_HEADER_LEFT),
        Paragraph("Action", STYLE_TABLE_HEADER),
        Paragraph("Item", STYLE_TABLE_HEADER_LEFT),
        Paragraph("Details", STYLE_TABLE_HEADER_LEFT),
    ]

    col_w = [
        CONTENT_W * 0.05,
        CONTENT_W * 0.16,
        CONTENT_W * 0.10,
        CONTENT_W * 0.24,
        CONTENT_W * 0.45,
    ]

    rows = [headers]

    for ai_idx, ai in enumerate(action_items):
        action_clr = ACTION_COLORS.get(ai["action"], AMBER)
        row = [
            Paragraph(str(ai_idx + 1), STYLE_TABLE_CELL),
            Paragraph(
                ai["member"],
                _style(f"ram{ai_idx}", size=7.5, color=ai["member_color"], bold=True),
            ),
            _action_badge_para(ai["action"]),
            Paragraph(
                ai["title"],
                _style(f"rai{ai_idx}", size=7.5, color=INK, leading=10),
            ),
            Paragraph(
                ai["detail"],
                _style(f"rad{ai_idx}", size=7, color="#4B5563", leading=9),
            ),
        ]
        rows.append(row)

    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _hex(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex(WHITE)),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.4, _hex(BORDER)),
    ]
    for row_idx in range(1, len(rows)):
        if row_idx % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, row_idx), (-1, row_idx), _hex(BG)))

    tbl.setStyle(TableStyle(style_cmds))
    elements.append(tbl)
    elements.append(PageBreak())
    return elements


def _build_shortlist_reference() -> list:
    """MeraSIP Shortlist Reference page."""
    elements: list = []

    elements.append(Paragraph("MeraSIP Recommended Shortlist", STYLE_SECTION_TITLE))
    elements.append(_hr(NAVY, thickness=1))
    elements.append(_spacer(8))

    elements.append(
        Paragraph(
            "The following funds constitute the MeraSIP curated shortlist for the current quarter. "
            "Fund selection is based on quantitative screening, risk-adjusted returns, consistency, "
            "fund manager track record, and portfolio construction suitability.",
            STYLE_BODY_JUSTIFY,
        )
    )
    elements.append(_spacer(10))

    shortlist_categories = [
        (
            "Large Cap",
            [
                "Mirae Asset Large Cap Fund",
                "ICICI Prudential Bluechip Fund",
                "Nippon India Large Cap Fund",
            ],
        ),
        (
            "Flexi / Multi Cap",
            [
                "Parag Parikh Flexi Cap Fund",
                "HDFC Flexi Cap Fund",
                "Kotak Flexicap Fund",
            ],
        ),
        (
            "Mid Cap",
            [
                "HDFC Mid-Cap Opportunities Fund",
                "Kotak Emerging Equity Fund",
                "Motilal Oswal Midcap Fund",
            ],
        ),
        (
            "Small Cap",
            [
                "Nippon India Small Cap Fund",
                "HDFC Small Cap Fund",
                "SBI Small Cap Fund",
            ],
        ),
        (
            "ELSS (Tax Saving)",
            [
                "Mirae Asset ELSS Tax Saver Fund",
                "Quant ELSS Tax Saver Fund",
                "DSP ELSS Tax Saver Fund",
            ],
        ),
        (
            "Hybrid / Balanced",
            [
                "ICICI Prudential Equity & Debt Fund",
                "HDFC Balanced Advantage Fund",
                "SBI Equity Hybrid Fund",
            ],
        ),
        (
            "Debt / Liquid",
            [
                "HDFC Short Term Debt Fund",
                "ICICI Prudential Savings Fund",
                "SBI Liquid Fund",
            ],
        ),
        (
            "International",
            [
                "Motilal Oswal Nasdaq 100 FoF",
                "PGIM India Global Equity Opp Fund",
            ],
        ),
    ]

    headers = [
        Paragraph("Category", STYLE_TABLE_HEADER_LEFT),
        Paragraph("Recommended Funds", STYLE_TABLE_HEADER_LEFT),
    ]

    col_w = [CONTENT_W * 0.25, CONTENT_W * 0.75]
    rows = [headers]

    for cat, funds in shortlist_categories:
        fund_text = "<br/>".join([f"&bull;&nbsp;&nbsp;{fn}" for fn in funds])
        row = [
            Paragraph(f"<b>{cat}</b>", _style("sc", size=8, color=NAVY, bold=True)),
            Paragraph(fund_text, _style("sf", size=8, leading=12)),
        ]
        rows.append(row)

    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _hex(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex(WHITE)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.4, _hex(BORDER)),
    ]
    for row_idx in range(1, len(rows)):
        if row_idx % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, row_idx), (-1, row_idx), _hex(BG)))

    tbl.setStyle(TableStyle(style_cmds))
    elements.append(tbl)
    elements.append(_spacer(12))

    elements.append(
        Paragraph(
            "<b>Note:</b> This shortlist is reviewed quarterly. Actual fund recommendations "
            "for individual portfolios may differ based on risk profile, investment horizon, "
            "existing holdings, and tax considerations. Consult your advisor before investing.",
            _style("sn", size=8, color="#4B5563", leading=11, align=TA_JUSTIFY),
        )
    )
    elements.append(_spacer(6))

    elements.append(
        Paragraph(
            f"Curated by {BRAND} Research  |  {ARN}  |  EUIN: {EUIN}",
            _style("sl", size=7, color="#9CA3AF", align=TA_CENTER),
        )
    )

    elements.append(PageBreak())
    return elements


def _build_back_page() -> list:
    """Final page: company info, legal, and contact."""
    elements: list = []

    elements.append(_spacer(40))

    # Company block
    elements.append(
        Paragraph("MeraSIP", _style("bp1", font="Georgia", size=22, color=NAVY, bold=True, align=TA_CENTER))
    )
    elements.append(
        Paragraph(
            "by Trustner",
            _style("bp2", font="Georgia", size=12, color=NAVY_DIM, italic=True, align=TA_CENTER),
        )
    )
    elements.append(_spacer(6))
    elements.append(
        HRFlowable(width="30%", thickness=1, color=_hex(NAVY), spaceBefore=4, spaceAfter=12)
    )

    elements.append(
        Paragraph(COMPANY_NAME, _style("bp3", font="Georgia", size=11, color=NAVY, bold=True, align=TA_CENTER))
    )
    elements.append(_spacer(12))

    # Details grid
    details = [
        ("ARN", ARN),
        ("EUIN", EUIN),
        ("CIN", CIN),
        ("Email", EMAIL),
        ("Phone", PHONE),
        ("Web", WEB),
    ]

    for label, value in details:
        row_para = Paragraph(
            f'<font color="{NAVY}"><b>{label}:</b></font>&nbsp;&nbsp;{value}',
            _style("bpd", size=9, color=INK, align=TA_CENTER),
        )
        elements.append(row_para)
        elements.append(_spacer(3))

    elements.append(_spacer(12))

    # Address
    elements.append(
        Paragraph(
            f"<b>Registered Office:</b>",
            _style("bpa1", size=9, color=NAVY, bold=True, align=TA_CENTER),
        )
    )
    elements.append(
        Paragraph(ADDRESS, _style("bpa2", size=8, color="#4B5563", align=TA_CENTER, leading=12))
    )
    elements.append(_spacer(30))

    # Decorative line
    elements.append(
        HRFlowable(width="60%", thickness=0.5, color=_hex(BORDER), spaceBefore=10, spaceAfter=10)
    )

    # Disclaimers
    legal_texts = [
        AMFI_DISCLAIMER_SHORT,
        (
            "This report is generated for informational purposes and does not constitute "
            "an offer to buy or sell mutual fund units. The information herein is believed "
            "to be reliable but is not guaranteed. The value of investments and the income "
            "from them can go down as well as up."
        ),
        (
            "The distributor receives commission from AMCs. Commission details are available "
            "on request and on the respective AMC websites. Investors should review the "
            "commission disclosure before investing."
        ),
        (
            f"Report generated by {BRAND} Portfolio Analytics Engine. "
            f"For queries, contact {EMAIL} or call {PHONE}."
        ),
    ]

    for txt in legal_texts:
        elements.append(Paragraph(txt, STYLE_DISCLAIMER))
        elements.append(_spacer(3))

    elements.append(_spacer(20))
    elements.append(
        Paragraph(
            f"\u00a9 {COMPANY_NAME}. All rights reserved.",
            _style("bpc", size=7, color="#9CA3AF", align=TA_CENTER),
        )
    )

    return elements


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def build_report(output_path: str, family_data: dict) -> str:
    """
    Generate a multi-member family portfolio PDF report.

    Parameters
    ----------
    output_path : str
        File path for the generated PDF (e.g. "reports/family_report.pdf").
    family_data : dict
        Family data dictionary matching the documented schema.

    Returns
    -------
    str
        The *output_path* string (same as the input argument).

    Raises
    ------
    ValueError
        If family_data is empty or missing required keys.
    OSError
        If the output directory cannot be created.
    """
    if not family_data:
        raise ValueError("family_data must be a non-empty dictionary")

    # Ensure output directory exists
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    members = family_data.get("members", [])

    # --- Build the document ---
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title=f"{family_data.get('group_name', 'Family')} - Portfolio Review",
        author=BRAND,
        subject="Family S.M.A.R.T Portfolio Review",
        creator=f"{BRAND} Report Engine",
    )

    story: list = []

    # Page 1: Cover
    story.extend(_build_cover(family_data))

    # Page 2: Disclaimer
    story.extend(_build_disclaimer())

    # Page 3: Family Dashboard
    story.extend(_build_family_dashboard(family_data))

    # Page 4: Member Bar Chart (only if >1 member)
    if len(members) > 1:
        story.extend(_build_member_bar_chart(family_data))

    # Pages 5+: Per-member sections
    for idx, member in enumerate(members):
        story.extend(_build_member_section(member, idx))

    # Consolidated Category Distribution
    if members:
        story.extend(_build_category_distribution(family_data))

    # Family Rebalancing Plan
    story.extend(_build_rebalancing_plan(family_data))

    # MeraSIP Shortlist Reference
    story.extend(_build_shortlist_reference())

    # Back Page
    story.extend(_build_back_page())

    # --- Render ---
    doc.build(story, onFirstPage=_header_footer_cover, onLaterPages=_header_footer)

    return output_path


# ---------------------------------------------------------------------------
# CLI convenience
# ---------------------------------------------------------------------------

def _demo_data() -> dict:
    """Return sample family data for testing / demo purposes."""
    return {
        "group_name": "Ram Shah Family",
        "group_subtitle": "Consolidated Mutual Fund Portfolio Review",
        "report_date": "08-Mar-2026",
        "sensex": "78,918.9",
        "members": [
            {
                "id": "RAM",
                "name": "Ram Shah",
                "pan": "ASOPS7764D",
                "folio_id": "1473544",
                "type": "Individual",
                "relation": "Primary Account Holder",
                "inv": 1586439,
                "val": 2318161,
                "gain": 731721,
                "abs_return": 46.12,
                "xirr": 15.57,
                "risk_profile": "Aggressive",
                "sip_monthly": 55000,
                "age_band": "45-55",
                "horizon": "10+ years",
                "funds": [
                    {
                        "name": "Nippon India Small Cap Fund",
                        "cat": "Small Cap",
                        "inv": 625000,
                        "val": 1278000,
                        "abs": 104.53,
                        "xirr": 18.63,
                        "action": "HOLD",
                        "since": "2019",
                    },
                    {
                        "name": "HDFC Mid-Cap Opportunities Fund",
                        "cat": "Mid Cap",
                        "inv": 340000,
                        "val": 490000,
                        "abs": 44.12,
                        "xirr": 14.21,
                        "action": "HOLD",
                        "since": "2020",
                    },
                    {
                        "name": "Parag Parikh Flexi Cap Fund",
                        "cat": "Flexi Cap",
                        "inv": 250000,
                        "val": 318000,
                        "abs": 27.2,
                        "xirr": 13.45,
                        "action": "HOLD",
                        "since": "2021",
                    },
                    {
                        "name": "Motilal Oswal Multi Cap Fund",
                        "cat": "Multi Cap",
                        "inv": 200000,
                        "val": 165000,
                        "abs": -17.5,
                        "xirr": -8.32,
                        "action": "SWITCH",
                        "since": "2023",
                    },
                    {
                        "name": "Mirae Asset ELSS Tax Saver Fund",
                        "cat": "ELSS",
                        "inv": 171439,
                        "val": 67161,
                        "abs": -60.82,
                        "xirr": -12.5,
                        "action": "REVIEW",
                        "since": "2022",
                    },
                ],
                "advice": [
                    [
                        "PORTFOLIO STRENGTH",
                        "HOLD",
                        "Nippon India Small Cap is the cornerstone holding with 104% abs return and 18.63% XIRR. Continue SIP.",
                    ],
                    [
                        "IMMEDIATE ACTION \u2014 SWITCH",
                        "SWITCH",
                        "Motilal Oswal Multi Cap (-17.32%) has underperformed its benchmark and category. Switch to HDFC Flexi Cap or Kotak Flexicap.",
                    ],
                    [
                        "REVIEW ELSS ALLOCATION",
                        "REVIEW",
                        "Mirae Asset ELSS has significant unrealized losses. If lock-in is over, consider switching to Quant ELSS Tax Saver.",
                    ],
                ],
            },
            {
                "id": "SITA",
                "name": "Sita Shah",
                "pan": "BMOPS4421A",
                "folio_id": "1473545",
                "type": "Individual",
                "relation": "Spouse",
                "inv": 820000,
                "val": 1045000,
                "gain": 225000,
                "abs_return": 27.44,
                "xirr": 12.83,
                "risk_profile": "Moderate",
                "sip_monthly": 30000,
                "age_band": "40-45",
                "horizon": "10+ years",
                "funds": [
                    {
                        "name": "ICICI Prudential Bluechip Fund",
                        "cat": "Large Cap",
                        "inv": 400000,
                        "val": 520000,
                        "abs": 30.0,
                        "xirr": 13.1,
                        "action": "HOLD",
                        "since": "2020",
                    },
                    {
                        "name": "HDFC Balanced Advantage Fund",
                        "cat": "Hybrid",
                        "inv": 250000,
                        "val": 315000,
                        "abs": 26.0,
                        "xirr": 12.5,
                        "action": "HOLD",
                        "since": "2021",
                    },
                    {
                        "name": "SBI Small Cap Fund",
                        "cat": "Small Cap",
                        "inv": 170000,
                        "val": 210000,
                        "abs": 23.53,
                        "xirr": 11.8,
                        "action": "HOLD",
                        "since": "2022",
                    },
                ],
                "advice": [
                    [
                        "WELL BALANCED PORTFOLIO",
                        "HOLD",
                        "Good mix of large cap stability and small cap growth. Continue current allocation.",
                    ],
                ],
            },
            {
                "id": "ARJUN",
                "name": "Arjun Shah",
                "pan": "CLOPS8832B",
                "folio_id": "1473546",
                "type": "Individual",
                "relation": "Son",
                "inv": 320000,
                "val": 395000,
                "gain": 75000,
                "abs_return": 23.44,
                "xirr": 16.21,
                "risk_profile": "Aggressive",
                "sip_monthly": 20000,
                "age_band": "20-25",
                "horizon": "20+ years",
                "funds": [
                    {
                        "name": "Quant Small Cap Fund",
                        "cat": "Small Cap",
                        "inv": 120000,
                        "val": 165000,
                        "abs": 37.5,
                        "xirr": 19.2,
                        "action": "HOLD",
                        "since": "2023",
                    },
                    {
                        "name": "Motilal Oswal Nasdaq 100 FoF",
                        "cat": "International",
                        "inv": 100000,
                        "val": 122000,
                        "abs": 22.0,
                        "xirr": 14.5,
                        "action": "HOLD",
                        "since": "2023",
                    },
                    {
                        "name": "HDFC Flexi Cap Fund",
                        "cat": "Flexi Cap",
                        "inv": 100000,
                        "val": 108000,
                        "abs": 8.0,
                        "xirr": 11.3,
                        "action": "REVIEW",
                        "since": "2024",
                    },
                ],
                "advice": [
                    [
                        "STRONG START",
                        "HOLD",
                        "Good aggressive allocation for a 20+ year horizon. Quant Small Cap showing strong returns.",
                    ],
                    [
                        "ADD MID CAP EXPOSURE",
                        "ADD",
                        "Consider adding HDFC Mid-Cap Opportunities or Kotak Emerging Equity to diversify small cap concentration.",
                    ],
                ],
            },
            {
                "id": "PRIYA",
                "name": "Priya Shah",
                "pan": "DLOPS3354C",
                "folio_id": "1473547",
                "type": "Individual",
                "relation": "Daughter",
                "inv": 180000,
                "val": 205000,
                "gain": 25000,
                "abs_return": 13.89,
                "xirr": 11.42,
                "risk_profile": "Moderate",
                "sip_monthly": 10000,
                "age_band": "18-25",
                "horizon": "15+ years",
                "funds": [
                    {
                        "name": "Mirae Asset Large Cap Fund",
                        "cat": "Large Cap",
                        "inv": 100000,
                        "val": 115000,
                        "abs": 15.0,
                        "xirr": 12.3,
                        "action": "HOLD",
                        "since": "2024",
                    },
                    {
                        "name": "DSP ELSS Tax Saver Fund",
                        "cat": "ELSS",
                        "inv": 80000,
                        "val": 90000,
                        "abs": 12.5,
                        "xirr": 10.1,
                        "action": "HOLD",
                        "since": "2024",
                    },
                ],
                "advice": [
                    [
                        "INCREASE SIP",
                        "ADD",
                        "Given 15+ year horizon, consider increasing SIP to 15K and adding mid/small cap exposure.",
                    ],
                ],
            },
            {
                "id": "MEERA",
                "name": "Meera Shah",
                "pan": "EMOPS6621D",
                "folio_id": "1473548",
                "type": "Individual",
                "relation": "Mother",
                "inv": 500000,
                "val": 580000,
                "gain": 80000,
                "abs_return": 16.0,
                "xirr": 8.52,
                "risk_profile": "Conservative",
                "sip_monthly": 15000,
                "age_band": "65-70",
                "horizon": "3-5 years",
                "funds": [
                    {
                        "name": "ICICI Prudential Equity & Debt Fund",
                        "cat": "Hybrid",
                        "inv": 200000,
                        "val": 242000,
                        "abs": 21.0,
                        "xirr": 9.8,
                        "action": "HOLD",
                        "since": "2021",
                    },
                    {
                        "name": "HDFC Short Term Debt Fund",
                        "cat": "Debt",
                        "inv": 200000,
                        "val": 222000,
                        "abs": 11.0,
                        "xirr": 7.2,
                        "action": "HOLD",
                        "since": "2022",
                    },
                    {
                        "name": "SBI Liquid Fund",
                        "cat": "Liquid",
                        "inv": 100000,
                        "val": 116000,
                        "abs": 16.0,
                        "xirr": 6.8,
                        "action": "HOLD",
                        "since": "2022",
                    },
                ],
                "advice": [
                    [
                        "CONSERVATIVE ALLOCATION APPROPRIATE",
                        "HOLD",
                        "Portfolio is well suited for conservative risk profile. Hybrid + Debt + Liquid provides stability.",
                    ],
                ],
            },
            {
                "id": "RAJAN",
                "name": "Rajan Shah",
                "pan": "FNOPS9912E",
                "folio_id": "1473549",
                "type": "Individual",
                "relation": "Father",
                "inv": 750000,
                "val": 920000,
                "gain": 170000,
                "abs_return": 22.67,
                "xirr": 10.95,
                "risk_profile": "Moderate",
                "sip_monthly": 25000,
                "age_band": "68-72",
                "horizon": "5-7 years",
                "funds": [
                    {
                        "name": "HDFC Balanced Advantage Fund",
                        "cat": "Hybrid",
                        "inv": 300000,
                        "val": 378000,
                        "abs": 26.0,
                        "xirr": 11.8,
                        "action": "HOLD",
                        "since": "2020",
                    },
                    {
                        "name": "ICICI Prudential Savings Fund",
                        "cat": "Debt",
                        "inv": 250000,
                        "val": 290000,
                        "abs": 16.0,
                        "xirr": 7.9,
                        "action": "HOLD",
                        "since": "2021",
                    },
                    {
                        "name": "Kotak Emerging Equity Fund",
                        "cat": "Mid Cap",
                        "inv": 200000,
                        "val": 252000,
                        "abs": 26.0,
                        "xirr": 13.5,
                        "action": "REVIEW",
                        "since": "2022",
                    },
                ],
                "advice": [
                    [
                        "REVIEW MID CAP EXPOSURE",
                        "REVIEW",
                        "At age 68-72, mid cap allocation of 22% may be too aggressive. Consider reducing to 10-15% and moving to debt.",
                    ],
                    [
                        "SYSTEMATIC WITHDRAWAL PLAN",
                        "REVIEW",
                        "Consider starting SWP from Balanced Advantage Fund for regular income. Target 8-10K per month.",
                    ],
                ],
            },
        ],
    }


if __name__ == "__main__":
    import sys

    out = sys.argv[1] if len(sys.argv) > 1 else "family_report_demo.pdf"
    data = _demo_data()
    result = build_report(out, data)
    print(f"Report generated: {result}")
    print(f"Members: {len(data['members'])}")
    total_inv = sum(m['inv'] for m in data['members'])
    total_val = sum(m['val'] for m in data['members'])
    print(f"Family invested: {_fmt_inr(total_inv, short=True)}")
    print(f"Family value:    {_fmt_inr(total_val, short=True)}")
    print(f"Family gain:     {_fmt_inr(total_val - total_inv, short=True)}")
