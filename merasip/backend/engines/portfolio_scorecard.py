"""
MeraSIP Portfolio Scorecard — 1-page branded PDF generator.

Generates a compact, single-page A4 Portfolio Scorecard PDF using ReportLab,
showing the health score gauge, 5-dimension bars, allocation pie, summary
table, recommendations, and strengths.

Company : Trustner Asset Services Pvt. Ltd.
ARN     : ARN-286886
Brand   : MeraSIP S.M.A.R.T Platform

Usage:
    from engines.portfolio_scorecard import generate_portfolio_scorecard
    pdf_bytes = generate_portfolio_scorecard(investor, summary, funds, health_score)
"""

from __future__ import annotations

import math
from io import BytesIO
from datetime import datetime
from typing import Any, Optional
from collections import defaultdict

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, Flowable,
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle, Wedge, Group
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF


# =============================================================================
# BRAND CONSTANTS
# =============================================================================

NAVY = HexColor('#1B3A6B')
NAVY_DIM = HexColor('#2E5299')
GREEN = HexColor('#0A7C4E')
RED = HexColor('#B91C1C')
AMBER = HexColor('#D97706')
GREY = HexColor('#6B7280')
LIGHT_GREY = HexColor('#F4F6F9')
LIGHT_BLUE = HexColor('#EFF6FF')
WHITE = HexColor('#FFFFFF')
INK = HexColor('#111827')
BORDER = HexColor('#D1D5DB')

COMPANY_NAME = "Trustner Asset Services Pvt. Ltd."
ARN = "ARN-286886"

# Page dimensions
PAGE_W, PAGE_H = A4  # 595.28, 841.89 points
MARGIN_LEFT = 14 * mm
MARGIN_RIGHT = 14 * mm
MARGIN_TOP = 10 * mm
MARGIN_BOTTOM = 10 * mm
CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT

# Fonts
FONT_SERIF = "Georgia"
FONT_SANS = "Helvetica"
FONT_SANS_BOLD = "Helvetica-Bold"
FONT_SANS_OBLIQUE = "Helvetica-Oblique"

# Pie chart palette
PIE_PALETTE = [
    '#1B3A6B', '#0A7C4E', '#B91C1C', '#5B21B6', '#92400E',
    '#0369A1', '#BE185D', '#4338CA', '#065F46', '#78350F',
]

# Grade descriptions
GRADE_DESC = {
    "A+": "Excellent — your portfolio is well-optimized",
    "A":  "Very Good — minor improvements possible",
    "B+": "Good — some areas need attention",
    "B":  "Fair — review recommended",
    "C":  "Below Average — significant improvements needed",
    "D":  "Needs Attention — urgent review recommended",
}

# Grade colors
GRADE_COLORS = {
    "A+": HexColor('#059669'),
    "A":  HexColor('#0A7C4E'),
    "B+": HexColor('#0369A1'),
    "B":  HexColor('#92400E'),
    "C":  HexColor('#B91C1C'),
    "D":  HexColor('#991B1B'),
}


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def _inr(v) -> str:
    """Format a value as INR with lakhs/crores notation.

    Uses 'Rs.' instead of the Unicode rupee sign (₹) because ReportLab's
    built-in Helvetica font lacks the U+20B9 glyph.
    """
    if v is None:
        return "—"
    try:
        v = float(v)
    except (TypeError, ValueError):
        return "—"
    neg = v < 0
    a = abs(v)
    if a >= 1e7:
        s = f"Rs.{a / 1e7:.2f} Cr"
    elif a >= 1e5:
        s = f"Rs.{a / 1e5:.2f} L"
    else:
        s = f"Rs.{a:,.0f}"
    return f"-{s}" if neg else s


def _pct(v, decimal: int = 1) -> str:
    """Format a percentage value."""
    if v is None:
        return "—"
    try:
        v = float(v)
    except (TypeError, ValueError):
        return "—"
    sign = "+" if v > 0 else ""
    return f"{sign}{v:.{decimal}f}%"


def _mask_pan(pan: str | None) -> str:
    """Mask PAN: ABCPX1234X -> ABCPX****X"""
    if not pan or len(pan) < 5:
        return pan or "—"
    return pan[:5] + "****" + pan[-1]


def _classify_fund_type(fund_name: str, category: str | None = None) -> str:
    """Classify a fund as equity / debt / gold / hybrid / other."""
    text = f"{fund_name} {category or ''}".lower()
    gold_kw = ["gold", "silver", "precious metal"]
    hybrid_kw = ["balanced advantage", "aggressive hybrid", "conservative hybrid",
                 "equity & debt", "equity savings", "multi asset", "asset allocator"]
    debt_kw = ["liquid", "overnight", "money market", "ultra short", "low duration",
               "short duration", "medium duration", "long duration", "gilt",
               "corporate bond", "credit risk", "dynamic bond", "floating rate",
               "banking & psu", "debt"]
    equity_kw = ["large cap", "largecap", "mid cap", "midcap", "small cap", "smallcap",
                 "flexi cap", "flexicap", "multi cap", "multicap", "elss", "tax sav",
                 "focused", "value", "contra", "large & mid", "dividend yield",
                 "sectoral", "thematic", "index", "nifty", "sensex", "etf"]

    if any(kw in text for kw in gold_kw):
        return "Gold"
    if any(kw in text for kw in hybrid_kw):
        return "Hybrid"
    if any(kw in text for kw in debt_kw):
        return "Debt"
    if any(kw in text for kw in equity_kw):
        return "Equity"
    return "Other"


def _compute_allocation(funds: list[dict]) -> dict[str, float]:
    """Compute asset-class allocation percentages from fund list."""
    totals: dict[str, float] = defaultdict(float)
    grand = 0.0
    for f in funds:
        val = float(f.get("value", 0) or 0)
        ftype = _classify_fund_type(f.get("name", ""), f.get("category"))
        totals[ftype] += val
        grand += val
    if grand <= 0:
        return {}
    return {k: round(v / grand * 100, 1) for k, v in totals.items() if v > 0}


# =============================================================================
# CUSTOM FLOWABLES
# =============================================================================

class HealthGaugeFlowable(Flowable):
    """Draws a circular health score gauge with grade coloring."""

    def __init__(self, score: int, grade: str, width: float = 100, height: float = 100):
        Flowable.__init__(self)
        self.score = score
        self.grade = grade
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        canvas = self.canv
        cx = self.width / 2
        cy = self.height / 2
        radius = min(cx, cy) - 4

        grade_color = GRADE_COLORS.get(self.grade, NAVY)

        # Outer ring background (grey)
        canvas.setStrokeColor(HexColor('#E5E7EB'))
        canvas.setLineWidth(8)
        canvas.circle(cx, cy, radius, stroke=1, fill=0)

        # Outer ring filled arc (colored by grade)
        extent = self.score / 100 * 360
        if extent > 0:
            canvas.setStrokeColor(grade_color)
            canvas.setLineWidth(8)
            # Draw arc: score/100 of full circle, starting from 90 degrees (top)
            canvas.arc(
                cx - radius, cy - radius,
                cx + radius, cy + radius,
                startAng=90, extent=extent,
            )

        # Inner fill circle
        canvas.setFillColor(WHITE)
        canvas.setStrokeColor(WHITE)
        canvas.circle(cx, cy, radius - 10, stroke=0, fill=1)

        # Score number
        canvas.setFont(FONT_SANS_BOLD, 28)
        canvas.setFillColor(grade_color)
        score_text = str(self.score)
        tw = canvas.stringWidth(score_text, FONT_SANS_BOLD, 28)
        canvas.drawString(cx - tw / 2, cy - 2, score_text)

        # Grade letter
        canvas.setFont(FONT_SANS_BOLD, 14)
        canvas.setFillColor(GREY)
        gw = canvas.stringWidth(self.grade, FONT_SANS_BOLD, 14)
        canvas.drawString(cx - gw / 2, cy - 18, self.grade)


class DimensionBarsFlowable(Flowable):
    """Draws horizontal score bars for 5 health dimensions."""

    def __init__(self, dimensions: dict, width: float = 340, bar_height: float = 10):
        Flowable.__init__(self)
        self.dimensions = dimensions
        self.total_width = width
        self.bar_height = bar_height
        self.row_height = 18
        self.label_width = 85
        self.bar_width = width - self.label_width - 45
        self.dim_order = ["diversification", "allocation", "overlap", "performance", "discipline"]
        self.dim_labels = {
            "diversification": "Diversification",
            "allocation": "Allocation",
            "overlap": "Overlap",
            "performance": "Performance",
            "discipline": "Discipline",
        }

    def wrap(self, availWidth, availHeight):
        num = len(self.dim_order)
        return self.total_width, num * self.row_height + 4

    def draw(self):
        canvas = self.canv
        y = (len(self.dim_order) - 1) * self.row_height

        for dim_key in self.dim_order:
            dim = self.dimensions.get(dim_key, {})
            score = dim.get("score", 0)
            max_score = dim.get("max", 20)
            label = self.dim_labels.get(dim_key, dim_key)

            # Label text
            canvas.setFont(FONT_SANS, 8)
            canvas.setFillColor(INK)
            canvas.drawString(0, y + 2, label)

            # Bar background
            bar_x = self.label_width
            canvas.setFillColor(HexColor('#E5E7EB'))
            canvas.rect(bar_x, y, self.bar_width, self.bar_height, stroke=0, fill=1)

            # Bar fill
            fill_pct = score / max_score if max_score > 0 else 0
            fill_w = self.bar_width * fill_pct
            if score >= 15:
                bar_color = GREEN
            elif score >= 10:
                bar_color = AMBER
            else:
                bar_color = RED
            canvas.setFillColor(bar_color)
            canvas.roundRect(bar_x, y, fill_w, self.bar_height, 2, stroke=0, fill=1)

            # Score text
            canvas.setFont(FONT_SANS_BOLD, 8)
            canvas.setFillColor(INK)
            canvas.drawString(bar_x + self.bar_width + 5, y + 2, f"{score}/{max_score}")

            y -= self.row_height


# =============================================================================
# PDF GENERATION
# =============================================================================

def generate_portfolio_scorecard(
    investor: dict,
    summary: dict,
    funds: list[dict],
    health_score: dict,
    risk_profile: str | None = None,
    gap_analysis: dict | None = None,
) -> bytes:
    """Generate a branded 1-page PDF Portfolio Scorecard and return as bytes.

    Args:
        investor: {name, pan, email, mobile, report_date}
        summary: {total_invested, total_value, total_gain, abs_return, xirr}
        funds: Full fund list from CAS parser.
        health_score: Full health score result from health_score.py.
        risk_profile: Optional risk profile string.
        gap_analysis: Optional gap analysis result.

    Returns:
        Raw PDF bytes.
    """
    buf = BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title="MeraSIP Portfolio Scorecard",
        author=COMPANY_NAME,
    )

    story: list = []

    # Extract health score data
    total_score = health_score.get("total_score", 0)
    grade = health_score.get("grade", "D")
    dimensions = health_score.get("dimensions", {})
    recommendations = health_score.get("recommendations", [])
    strengths = health_score.get("strengths", [])

    # -------------------------------------------------------------------------
    # STYLES
    # -------------------------------------------------------------------------

    s_logo = ParagraphStyle("logo", fontName="Times-Bold", fontSize=22, leading=26,
                            textColor=NAVY, spaceAfter=0)
    s_subtitle = ParagraphStyle("subtitle", fontName=FONT_SANS, fontSize=10, leading=13,
                                textColor=GREY, spaceAfter=0)
    s_company = ParagraphStyle("company", fontName=FONT_SANS, fontSize=7, leading=9,
                               textColor=GREY, alignment=TA_RIGHT, spaceAfter=0)
    s_section = ParagraphStyle("section", fontName=FONT_SANS_BOLD, fontSize=9.5, leading=12,
                               textColor=NAVY, spaceBefore=4, spaceAfter=2)
    s_body = ParagraphStyle("body", fontName=FONT_SANS, fontSize=8, leading=11,
                            textColor=INK)
    s_body_small = ParagraphStyle("body_small", fontName=FONT_SANS, fontSize=7, leading=9,
                                  textColor=GREY)
    s_body_center = ParagraphStyle("body_center", fontName=FONT_SANS, fontSize=8, leading=11,
                                   textColor=INK, alignment=TA_CENTER)
    s_gauge_title = ParagraphStyle("gauge_title", fontName=FONT_SANS_BOLD, fontSize=9,
                                   leading=12, textColor=NAVY, alignment=TA_CENTER,
                                   spaceAfter=1)
    s_grade_desc = ParagraphStyle("grade_desc", fontName=FONT_SANS, fontSize=8, leading=11,
                                  textColor=GRADE_COLORS.get(grade, NAVY))
    s_rec = ParagraphStyle("rec", fontName=FONT_SANS, fontSize=7.5, leading=10,
                           textColor=INK, leftIndent=10)
    s_strength = ParagraphStyle("strength", fontName=FONT_SANS, fontSize=7.5, leading=10,
                                textColor=GREEN, leftIndent=10)
    s_footer = ParagraphStyle("footer", fontName=FONT_SANS, fontSize=6, leading=8,
                              textColor=GREY, alignment=TA_CENTER)
    s_disclaimer = ParagraphStyle("disclaimer", fontName=FONT_SANS_OBLIQUE, fontSize=5.5,
                                  leading=7.5, textColor=GREY, alignment=TA_CENTER)

    # -------------------------------------------------------------------------
    # HEADER
    # -------------------------------------------------------------------------

    header_data = [[
        Paragraph("MeraSIP", s_logo),
        Paragraph(f"{COMPANY_NAME} | {ARN}", s_company),
    ]]
    header_table = Table(header_data, colWidths=[CONTENT_W * 0.5, CONTENT_W * 0.5])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)

    # Subtitle
    story.append(Paragraph("Portfolio Scorecard", s_subtitle))
    story.append(Spacer(1, 2 * mm))

    # Navy separator line
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY,
                            spaceBefore=0, spaceAfter=3 * mm))

    # -------------------------------------------------------------------------
    # CLIENT INFO BAR
    # -------------------------------------------------------------------------

    inv_name = investor.get("name", "Investor")
    inv_pan = _mask_pan(investor.get("pan"))
    report_date = investor.get("report_date") or datetime.now().strftime("%d %b %Y")
    risk_text = risk_profile or "—"

    info_cells = [
        [
            Paragraph(f"<b>Name:</b> {inv_name}", s_body),
            Paragraph(f"<b>PAN:</b> {inv_pan}", s_body_center),
            Paragraph(f"<b>Date:</b> {report_date}", s_body_center),
            Paragraph(f"<b>Risk Profile:</b> {risk_text}", s_body_center),
        ]
    ]
    info_table = Table(info_cells, colWidths=[
        CONTENT_W * 0.30, CONTENT_W * 0.22, CONTENT_W * 0.22, CONTENT_W * 0.26
    ])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GREY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 3 * mm))

    # -------------------------------------------------------------------------
    # HEALTH SCORE GAUGE + GRADE + DIMENSION BARS (side by side)
    # -------------------------------------------------------------------------

    gauge = HealthGaugeFlowable(total_score, grade, width=90, height=90)
    gauge_label = Paragraph("Your Portfolio Health", s_gauge_title)
    grade_desc_text = GRADE_DESC.get(grade, "")
    grade_para = Paragraph(f"<b>Grade {grade}:</b> {grade_desc_text}", s_grade_desc)

    dim_bars = DimensionBarsFlowable(dimensions, width=310, bar_height=9)

    # Build a 2-column layout: gauge on left, bars on right
    gauge_col = Table(
        [[gauge_label], [gauge], [grade_para]],
        colWidths=[100],
    )
    gauge_col.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))

    bars_col = Table(
        [
            [Paragraph("<b>Health Dimensions</b> (each scored out of 20)", s_section)],
            [dim_bars],
        ],
        colWidths=[CONTENT_W - 120],
    )
    bars_col.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    gauge_row = Table(
        [[gauge_col, bars_col]],
        colWidths=[120, CONTENT_W - 120],
    )
    gauge_row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    story.append(gauge_row)
    story.append(Spacer(1, 3 * mm))

    # -------------------------------------------------------------------------
    # ALLOCATION PIE + SUMMARY TABLE (side by side)
    # -------------------------------------------------------------------------

    allocation = _compute_allocation(funds)

    # Build the pie chart drawing
    pie_drawing = Drawing(140, 110)
    if allocation:
        pie = Pie()
        pie.x = 10
        pie.y = 10
        pie.width = 80
        pie.height = 80
        pie.data = list(allocation.values())
        pie.labels = [f"{k} {v}%" for k, v in allocation.items()]
        pie.sideLabels = True
        pie.sideLabelsOffset = 0.05
        pie.slices.strokeWidth = 0.5
        pie.slices.strokeColor = WHITE
        for i, _ in enumerate(allocation):
            color_hex = PIE_PALETTE[i % len(PIE_PALETTE)]
            pie.slices[i].fillColor = HexColor(color_hex)
            pie.slices[i].labelRadius = 1.3
            pie.slices[i].fontName = FONT_SANS
            pie.slices[i].fontSize = 6.5
        pie_drawing.add(pie)

    # Portfolio Summary Table
    total_invested = summary.get("total_invested")
    total_value = summary.get("total_value")
    total_gain = summary.get("total_gain")
    abs_return = summary.get("abs_return")
    xirr = summary.get("xirr")
    num_funds = len(funds) if funds else 0
    amcs = set()
    for f in funds:
        amc = f.get("amc")
        if amc:
            amcs.add(amc)
    num_amcs = len(amcs)

    # Color gain/loss
    gain_color = GREEN if (total_gain is not None and total_gain >= 0) else RED

    sum_rows = [
        ["Total Invested", _inr(total_invested)],
        ["Current Value", _inr(total_value)],
        ["Absolute Return", _pct(abs_return)],
    ]
    if xirr is not None:
        sum_rows.append(["XIRR", _pct(xirr)])
    sum_rows.append(["Number of Funds", str(num_funds)])
    sum_rows.append(["Number of AMCs", str(num_amcs)])

    sum_para_rows = []
    for label, val in sum_rows:
        sum_para_rows.append([
            Paragraph(f"<b>{label}</b>", s_body),
            Paragraph(val, s_body),
        ])

    summary_table = Table(sum_para_rows, colWidths=[90, 75])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_GREY),
    ]))

    # Side by side: Pie on left, Summary on right
    pie_header = Paragraph("<b>Asset Allocation</b>", s_section)
    sum_header = Paragraph("<b>Portfolio Summary</b>", s_section)

    left_col = Table(
        [[pie_header], [pie_drawing]],
        colWidths=[CONTENT_W * 0.45],
    )
    left_col.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    right_col = Table(
        [[sum_header], [summary_table]],
        colWidths=[CONTENT_W * 0.55],
    )
    right_col.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    alloc_row = Table(
        [[left_col, right_col]],
        colWidths=[CONTENT_W * 0.45, CONTENT_W * 0.55],
    )
    alloc_row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    story.append(alloc_row)
    story.append(Spacer(1, 3 * mm))

    # -------------------------------------------------------------------------
    # RECOMMENDATIONS (top 3) + STRENGTHS (side by side)
    # -------------------------------------------------------------------------

    recs = recommendations[:3]
    strs = strengths[:3]

    # Recommendations box
    rec_items = []
    rec_items.append(Paragraph("<b>Top Recommendations</b>", s_section))
    for i, rec in enumerate(recs, 1):
        rec_items.append(Paragraph(f"<b>{i}.</b> {rec}", s_rec))
    if not recs:
        rec_items.append(Paragraph("No specific recommendations at this time.", s_rec))

    rec_box_content = Table(
        [[item] for item in rec_items],
        colWidths=[CONTENT_W * 0.55 - 10],
    )
    rec_box_content.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))

    rec_box = Table(
        [[rec_box_content]],
        colWidths=[CONTENT_W * 0.55 - 4],
    )
    rec_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('BOX', (0, 0), (-1, -1), 0.5, HexColor('#93C5FD')),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))

    # Strengths box
    str_items = []
    str_items.append(Paragraph("<b>Strengths</b>", ParagraphStyle(
        "str_header", fontName=FONT_SANS_BOLD, fontSize=9.5, leading=12,
        textColor=GREEN, spaceBefore=0, spaceAfter=2,
    )))
    for st in strs:
        str_items.append(Paragraph(f"✔ {st}", s_strength))
    if not strs:
        str_items.append(Paragraph("✔ Portfolio uploaded for analysis.", s_strength))

    str_box_content = Table(
        [[item] for item in str_items],
        colWidths=[CONTENT_W * 0.45 - 16],
    )
    str_box_content.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))

    str_box = Table(
        [[str_box_content]],
        colWidths=[CONTENT_W * 0.45 - 10],
    )
    str_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#ECFDF5')),
        ('BOX', (0, 0), (-1, -1), 0.5, HexColor('#6EE7B7')),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))

    # Side by side
    rec_str_row = Table(
        [[rec_box, str_box]],
        colWidths=[CONTENT_W * 0.55, CONTENT_W * 0.45],
    )
    rec_str_row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    story.append(rec_str_row)
    story.append(Spacer(1, 4 * mm))

    # -------------------------------------------------------------------------
    # FOOTER
    # -------------------------------------------------------------------------

    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER,
                            spaceBefore=0, spaceAfter=2 * mm))

    story.append(Paragraph(
        "Generated by MeraSIP S.M.A.R.T Platform | www.merasip.com",
        s_footer,
    ))
    story.append(Paragraph(
        "Schedule a Review: wa.me/916003903737",
        s_footer,
    ))
    story.append(Spacer(1, 1.5 * mm))

    disclaimer_text = (
        "This is a portfolio analysis report, not investment advice. "
        "Trustner Asset Services Pvt. Ltd. is an AMFI-registered Mutual Fund Distributor "
        f"({ARN}), not a SEBI-registered Investment Adviser. "
        "Mutual fund investments are subject to market risks. "
        "Read all scheme related documents carefully."
    )
    story.append(Paragraph(disclaimer_text, s_disclaimer))

    story.append(Spacer(1, 1 * mm))
    gen_time = datetime.now().strftime("%d %b %Y, %I:%M %p")
    story.append(Paragraph(f"Generated on {gen_time}", ParagraphStyle(
        "gen_time", fontName=FONT_SANS, fontSize=5.5, leading=7,
        textColor=GREY, alignment=TA_CENTER,
    )))

    # -------------------------------------------------------------------------
    # BUILD PDF
    # -------------------------------------------------------------------------

    doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
