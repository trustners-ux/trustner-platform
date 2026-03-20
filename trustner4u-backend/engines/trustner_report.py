"""
MeraSIP by Trustner — Individual Investor Portfolio PDF Report Generator.

Generates a professional, print-ready A4 PDF report using ReportLab.
Brand: Trustner Asset Services Pvt. Ltd. (ARN-286886, EUIN: E092119)

Usage:
    from merasip.backend.engines.trustner_report import build_report
    path = build_report("report.pdf", investor_data, funds_list)
"""

import os
import math
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak, CondPageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics import renderPDF

# Try importing the shortlist for reference page; graceful fallback if unavailable
try:
    from merasip.backend.engines.shortlist import MERASIP_SHORTLIST
except ImportError:
    MERASIP_SHORTLIST = {}


# =============================================================================
# BRAND CONSTANTS
# =============================================================================

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

# Action badge color mapping
ACTION_COLORS = {
    "HOLD": EMERALD,
    "SWITCH": CRIMSON,
    "EXIT": CRIMSON,
    "REVIEW": AMBER,
    "ADD": VIOLET,
}

# Company details
COMPANY_NAME = "Trustner Asset Services Pvt. Ltd."
ARN = "ARN-286886"
EUIN = "E092119"
CIN = "U66301AS2023PTC025505"
ADDRESS = (
    "Sethi Trust, Unit 2, 4th Floor, G S Road, "
    "Bhangagarh, Dispur, Guwahati \u2013 781005, Assam"
)
EMAIL = "wecare@finedgeservices.com"
WEB = "www.merasip.com"
PHONE = "+91 60039 03731"

# Page dimensions
PAGE_W, PAGE_H = A4  # 595.28, 841.89 points
MARGIN_LEFT = 18 * mm
MARGIN_RIGHT = 18 * mm
MARGIN_TOP = 16 * mm
MARGIN_BOTTOM = 20 * mm
CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT

# Fonts
FONT_SERIF = "Georgia"  # headings — fallback to Times-Roman if unavailable
FONT_SANS = "Helvetica"
FONT_SANS_BOLD = "Helvetica-Bold"
FONT_SANS_OBLIQUE = "Helvetica-Oblique"
FONT_SANS_BOLD_OBLIQUE = "Helvetica-BoldOblique"

# Pie chart palette (category allocation)
PIE_PALETTE = [
    "#1B3A6B", "#0A7C4E", "#B91C1C", "#5B21B6", "#92400E",
    "#0369A1", "#BE185D", "#4338CA", "#065F46", "#78350F",
    "#7C3AED", "#059669", "#DC2626", "#D97706", "#2563EB",
    "#6D28D9", "#DB2777", "#0891B2", "#84CC16", "#F59E0B",
]

# AMFI disclaimer (short version for footer)
AMFI_FOOTER = (
    "Mutual fund investments are subject to market risks. "
    "Read all scheme related documents carefully."
)

# Full disclaimer text
DISCLAIMER_FULL = """This report is prepared by MeraSIP (a brand of Trustner Asset Services Pvt. Ltd.) \
for the exclusive use of the investor named herein. The information contained in this report is compiled \
from sources believed to be reliable but no representation or warranty, express or implied, is made as to \
its accuracy, completeness, or correctness.

Past performance is not indicative of future results. The value of investments and the income from them \
can go down as well as up. Investors may not get back the amount originally invested.

This report does not constitute an offer, solicitation, or recommendation for the purchase or sale of \
any mutual fund units. Investment decisions should be made based on the investor's own judgment and \
after consulting with a qualified financial advisor.

All returns mentioned are historical and may not be sustained in the future. XIRR (Extended Internal Rate \
of Return) is calculated based on actual transaction dates and amounts and represents the annualized return \
of the investment. Absolute return represents the total return since investment without annualization.

The fund recommendations, action items (HOLD / SWITCH / REVIEW / EXIT), and analysis provided herein \
are based on quantitative screening criteria and do not take into account the investor's complete financial \
situation, risk tolerance, or investment objectives. These should be treated as indicative suggestions \
and not as personalized investment advice.

MeraSIP and Trustner Asset Services Pvt. Ltd. are AMFI Registered Mutual Fund Distributors (ARN-286886). \
We receive trail commissions from Asset Management Companies for distributing mutual fund schemes. \
This may create a potential conflict of interest. Investors are advised to consider this while evaluating \
our recommendations.

For any grievances, investors may approach: AMFI (www.amfiindia.com), SEBI SCORES \
(https://scores.sebi.gov.in), or the respective AMC's investor grievance cell.

By reading this report, the investor acknowledges that investment in mutual funds involves risks and \
that the final investment decision is solely the investor's responsibility."""

COMMISSION_DISCLOSURE = """Commission Disclosure: As an AMFI Registered Mutual Fund Distributor \
(ARN-286886), Trustner Asset Services Pvt. Ltd. receives trail commissions from Asset Management \
Companies (AMCs) for distributing Regular Plan mutual fund schemes. The commission rates vary by \
AMC and scheme category. This commission is already factored into the scheme's expense ratio and \
is not charged separately to the investor. The difference in expense ratio between Regular and \
Direct plans of the same scheme reflects the distribution commission. Investors who wish to invest \
without distributor commission may consider Direct Plans of mutual fund schemes."""


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def _hex_to_color(hex_str: str) -> colors.Color:
    """Convert hex color string to ReportLab Color object."""
    hex_str = hex_str.lstrip("#")
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0
    return colors.Color(r, g, b)


def _format_inr(amount: float, compact: bool = True) -> str:
    """
    Format amount in Indian Rupee notation.

    Args:
        amount: The amount to format.
        compact: If True, use L (Lakhs) and Cr (Crores) notation.

    Returns:
        Formatted string with INR symbol.
    """
    if amount is None:
        return "--"

    sign = ""
    if amount < 0:
        sign = "-"
        amount = abs(amount)

    if compact and amount >= 1_00_00_000:
        # Crores
        cr = amount / 1_00_00_000
        if cr >= 100:
            return f"{sign}\u20b9{cr:,.0f} Cr"
        elif cr >= 10:
            return f"{sign}\u20b9{cr:,.1f} Cr"
        else:
            return f"{sign}\u20b9{cr:,.2f} Cr"
    elif compact and amount >= 1_00_000:
        # Lakhs
        lk = amount / 1_00_000
        if lk >= 10:
            return f"{sign}\u20b9{lk:,.1f} L"
        else:
            return f"{sign}\u20b9{lk:,.2f} L"
    else:
        # Standard Indian comma format (manual)
        return f"{sign}\u20b9{_indian_comma_format(amount)}"


def _indian_comma_format(amount: float) -> str:
    """Format number with Indian comma system (e.g., 12,34,567)."""
    if amount is None:
        return "--"

    amount = round(amount)
    s = str(int(abs(amount)))
    sign = "-" if amount < 0 else ""

    if len(s) <= 3:
        return f"{sign}{s}"

    last_three = s[-3:]
    remaining = s[:-3]

    # Add commas every 2 digits for the remaining part
    groups = []
    while len(remaining) > 2:
        groups.insert(0, remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        groups.insert(0, remaining)

    return f"{sign}{','.join(groups)},{last_three}"


def _format_pct(value: Optional[float], decimal: int = 2) -> str:
    """Format a percentage value with sign."""
    if value is None:
        return "--"
    sign = "+" if value > 0 else ""
    return f"{sign}{value:.{decimal}f}%"


def _format_units(units: Optional[float]) -> str:
    """Format units to 3 decimal places."""
    if units is None:
        return "--"
    return f"{units:,.3f}"


def _format_nav(nav: Optional[float]) -> str:
    """Format NAV to 2 decimal places."""
    if nav is None:
        return "--"
    return f"\u20b9{nav:,.2f}"


def _safe_get(d: dict, key: str, default: Any = None) -> Any:
    """Safely get a value from a dict, returning default if None or missing."""
    val = d.get(key, default)
    return val if val is not None else default


def _gain_color(value: Optional[float]) -> str:
    """Return hex color for gain (green) or loss (red)."""
    if value is None:
        return INK
    return EMERALD if value >= 0 else CRIMSON


def _action_badge_color(action: str) -> str:
    """Return hex color for an action badge."""
    return ACTION_COLORS.get(action.upper(), INK)


# =============================================================================
# PARAGRAPH STYLES
# =============================================================================

def _build_styles() -> Dict[str, ParagraphStyle]:
    """Build all ParagraphStyles used in the report."""

    styles = {}

    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName=FONT_SANS_BOLD,
        fontSize=28,
        leading=34,
        textColor=_hex_to_color(WHITE),
        alignment=TA_CENTER,
        spaceAfter=6 * mm,
    )

    styles["cover_subtitle"] = ParagraphStyle(
        "cover_subtitle",
        fontName=FONT_SANS,
        fontSize=14,
        leading=18,
        textColor=_hex_to_color("#C7D2E8"),
        alignment=TA_CENTER,
        spaceAfter=3 * mm,
    )

    styles["cover_investor"] = ParagraphStyle(
        "cover_investor",
        fontName=FONT_SANS_BOLD,
        fontSize=20,
        leading=26,
        textColor=_hex_to_color(WHITE),
        alignment=TA_CENTER,
        spaceAfter=2 * mm,
    )

    styles["cover_detail"] = ParagraphStyle(
        "cover_detail",
        fontName=FONT_SANS,
        fontSize=11,
        leading=15,
        textColor=_hex_to_color("#A0B4D4"),
        alignment=TA_CENTER,
        spaceAfter=1 * mm,
    )

    styles["h1"] = ParagraphStyle(
        "h1",
        fontName=FONT_SANS_BOLD,
        fontSize=18,
        leading=24,
        textColor=_hex_to_color(NAVY),
        spaceBefore=4 * mm,
        spaceAfter=3 * mm,
    )

    styles["h2"] = ParagraphStyle(
        "h2",
        fontName=FONT_SANS_BOLD,
        fontSize=14,
        leading=19,
        textColor=_hex_to_color(NAVY),
        spaceBefore=3 * mm,
        spaceAfter=2 * mm,
    )

    styles["h3"] = ParagraphStyle(
        "h3",
        fontName=FONT_SANS_BOLD,
        fontSize=11,
        leading=15,
        textColor=_hex_to_color(NAVY_DIM),
        spaceBefore=2 * mm,
        spaceAfter=1.5 * mm,
    )

    styles["body"] = ParagraphStyle(
        "body",
        fontName=FONT_SANS,
        fontSize=9.5,
        leading=13.5,
        textColor=_hex_to_color(INK),
        alignment=TA_JUSTIFY,
        spaceAfter=2 * mm,
    )

    styles["body_small"] = ParagraphStyle(
        "body_small",
        fontName=FONT_SANS,
        fontSize=8,
        leading=11,
        textColor=_hex_to_color(INK),
        alignment=TA_JUSTIFY,
        spaceAfter=1.5 * mm,
    )

    styles["body_center"] = ParagraphStyle(
        "body_center",
        fontName=FONT_SANS,
        fontSize=9.5,
        leading=13.5,
        textColor=_hex_to_color(INK),
        alignment=TA_CENTER,
    )

    styles["disclaimer"] = ParagraphStyle(
        "disclaimer",
        fontName=FONT_SANS,
        fontSize=8.5,
        leading=12.5,
        textColor=_hex_to_color("#374151"),
        alignment=TA_JUSTIFY,
        spaceAfter=3 * mm,
    )

    styles["footer"] = ParagraphStyle(
        "footer",
        fontName=FONT_SANS,
        fontSize=6.5,
        leading=8.5,
        textColor=_hex_to_color("#6B7280"),
        alignment=TA_CENTER,
    )

    styles["header"] = ParagraphStyle(
        "header",
        fontName=FONT_SANS,
        fontSize=7,
        leading=9,
        textColor=_hex_to_color(NAVY_DIM),
        alignment=TA_LEFT,
    )

    styles["kpi_value"] = ParagraphStyle(
        "kpi_value",
        fontName=FONT_SANS_BOLD,
        fontSize=16,
        leading=20,
        textColor=_hex_to_color(NAVY),
        alignment=TA_CENTER,
    )

    styles["kpi_label"] = ParagraphStyle(
        "kpi_label",
        fontName=FONT_SANS,
        fontSize=8,
        leading=10,
        textColor=_hex_to_color("#6B7280"),
        alignment=TA_CENTER,
    )

    styles["table_header"] = ParagraphStyle(
        "table_header",
        fontName=FONT_SANS_BOLD,
        fontSize=8,
        leading=10,
        textColor=_hex_to_color(WHITE),
        alignment=TA_LEFT,
    )

    styles["table_header_center"] = ParagraphStyle(
        "table_header_center",
        fontName=FONT_SANS_BOLD,
        fontSize=8,
        leading=10,
        textColor=_hex_to_color(WHITE),
        alignment=TA_CENTER,
    )

    styles["table_header_right"] = ParagraphStyle(
        "table_header_right",
        fontName=FONT_SANS_BOLD,
        fontSize=8,
        leading=10,
        textColor=_hex_to_color(WHITE),
        alignment=TA_RIGHT,
    )

    styles["table_cell"] = ParagraphStyle(
        "table_cell",
        fontName=FONT_SANS,
        fontSize=8,
        leading=11,
        textColor=_hex_to_color(INK),
        alignment=TA_LEFT,
    )

    styles["table_cell_center"] = ParagraphStyle(
        "table_cell_center",
        fontName=FONT_SANS,
        fontSize=8,
        leading=11,
        textColor=_hex_to_color(INK),
        alignment=TA_CENTER,
    )

    styles["table_cell_right"] = ParagraphStyle(
        "table_cell_right",
        fontName=FONT_SANS,
        fontSize=8,
        leading=11,
        textColor=_hex_to_color(INK),
        alignment=TA_RIGHT,
    )

    styles["table_cell_bold"] = ParagraphStyle(
        "table_cell_bold",
        fontName=FONT_SANS_BOLD,
        fontSize=8,
        leading=11,
        textColor=_hex_to_color(INK),
        alignment=TA_LEFT,
    )

    styles["fund_name"] = ParagraphStyle(
        "fund_name",
        fontName=FONT_SANS_BOLD,
        fontSize=10,
        leading=13,
        textColor=_hex_to_color(NAVY),
        spaceAfter=0.5 * mm,
    )

    styles["fund_meta"] = ParagraphStyle(
        "fund_meta",
        fontName=FONT_SANS,
        fontSize=7.5,
        leading=10,
        textColor=_hex_to_color("#6B7280"),
    )

    styles["analysis_text"] = ParagraphStyle(
        "analysis_text",
        fontName=FONT_SANS_OBLIQUE,
        fontSize=8,
        leading=11.5,
        textColor=_hex_to_color("#374151"),
        leftIndent=4 * mm,
        rightIndent=2 * mm,
        spaceBefore=1 * mm,
        spaceAfter=2 * mm,
        alignment=TA_JUSTIFY,
    )

    styles["badge"] = ParagraphStyle(
        "badge",
        fontName=FONT_SANS_BOLD,
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
    )

    styles["back_title"] = ParagraphStyle(
        "back_title",
        fontName=FONT_SANS_BOLD,
        fontSize=22,
        leading=28,
        textColor=_hex_to_color(NAVY),
        alignment=TA_CENTER,
        spaceAfter=4 * mm,
    )

    styles["back_detail"] = ParagraphStyle(
        "back_detail",
        fontName=FONT_SANS,
        fontSize=10,
        leading=14,
        textColor=_hex_to_color(INK),
        alignment=TA_CENTER,
        spaceAfter=1.5 * mm,
    )

    styles["back_disclaimer"] = ParagraphStyle(
        "back_disclaimer",
        fontName=FONT_SANS_BOLD,
        fontSize=10,
        leading=14,
        textColor=_hex_to_color(CRIMSON),
        alignment=TA_CENTER,
        spaceBefore=6 * mm,
        spaceAfter=2 * mm,
    )

    styles["shortlist_cat"] = ParagraphStyle(
        "shortlist_cat",
        fontName=FONT_SANS_BOLD,
        fontSize=9,
        leading=12,
        textColor=_hex_to_color(NAVY),
        spaceBefore=2 * mm,
        spaceAfter=1 * mm,
    )

    styles["shortlist_fund"] = ParagraphStyle(
        "shortlist_fund",
        fontName=FONT_SANS,
        fontSize=8,
        leading=11,
        textColor=_hex_to_color(INK),
        leftIndent=4 * mm,
    )

    return styles


# =============================================================================
# HEADER / FOOTER CALLBACK
# =============================================================================

def _header_footer(canvas, doc, page_num_override: Optional[int] = None):
    """Draw header and footer on every page (except cover page)."""
    canvas.saveState()

    page_num = page_num_override or doc.page

    # --- Header ---
    # Thin navy line across the top
    y_header = PAGE_H - 10 * mm
    canvas.setStrokeColor(_hex_to_color(NAVY))
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_LEFT, y_header, PAGE_W - MARGIN_RIGHT, y_header)

    # Left: brand name + ARN
    canvas.setFont(FONT_SANS_BOLD, 7)
    canvas.setFillColor(_hex_to_color(NAVY))
    canvas.drawString(MARGIN_LEFT, y_header + 2.5 * mm, f"MeraSIP  |  {ARN}")

    # Right: page number
    canvas.setFont(FONT_SANS, 7)
    canvas.setFillColor(_hex_to_color("#6B7280"))
    canvas.drawRightString(
        PAGE_W - MARGIN_RIGHT,
        y_header + 2.5 * mm,
        f"Page {page_num}",
    )

    # --- Footer ---
    y_footer = 10 * mm
    canvas.setStrokeColor(_hex_to_color(BORDER))
    canvas.setLineWidth(0.3)
    canvas.line(MARGIN_LEFT, y_footer + 3 * mm, PAGE_W - MARGIN_RIGHT, y_footer + 3 * mm)

    canvas.setFont(FONT_SANS, 5.5)
    canvas.setFillColor(_hex_to_color("#9CA3AF"))
    canvas.drawCentredString(
        PAGE_W / 2, y_footer,
        AMFI_FOOTER,
    )

    canvas.restoreState()


# =============================================================================
# COVER PAGE
# =============================================================================

def _build_cover_page(canvas, doc, investor: dict):
    """Draw the navy-background cover page directly on canvas."""
    canvas.saveState()

    # Full-page navy background
    canvas.setFillColor(_hex_to_color(NAVY))
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Decorative subtle pattern — diagonal lines
    canvas.setStrokeColor(_hex_to_color(NAVY_DIM))
    canvas.setLineWidth(0.3)
    for i in range(0, int(PAGE_H) + 300, 40):
        canvas.line(0, i, i, 0)

    # Decorative circle in top-right
    canvas.setFillColor(_hex_to_color(NAVY_DIM))
    canvas.setFillAlpha(0.15)
    canvas.circle(PAGE_W - 60, PAGE_H - 80, 120, fill=1, stroke=0)
    canvas.circle(80, 200, 80, fill=1, stroke=0)
    canvas.setFillAlpha(1.0)

    # Brand name at top
    y = PAGE_H - 60 * mm
    canvas.setFont(FONT_SANS_BOLD, 12)
    canvas.setFillColor(_hex_to_color("#A0B4D4"))
    canvas.drawCentredString(PAGE_W / 2, y + 50 * mm, "MeraSIP by Trustner")

    # Main title
    canvas.setFont(FONT_SANS_BOLD, 32)
    canvas.setFillColor(_hex_to_color(WHITE))
    canvas.drawCentredString(PAGE_W / 2, y + 30 * mm, "S.M.A.R.T")

    canvas.setFont(FONT_SANS_BOLD, 18)
    canvas.drawCentredString(PAGE_W / 2, y + 18 * mm, "Portfolio Review")

    # Decorative line
    canvas.setStrokeColor(_hex_to_color(EMERALD))
    canvas.setLineWidth(2)
    canvas.line(PAGE_W / 2 - 40 * mm, y + 10 * mm, PAGE_W / 2 + 40 * mm, y + 10 * mm)

    # Investor name
    investor_name = _safe_get(investor, "name", "Investor")
    canvas.setFont(FONT_SANS_BOLD, 22)
    canvas.setFillColor(_hex_to_color(WHITE))
    canvas.drawCentredString(PAGE_W / 2, y - 10 * mm, investor_name)

    # Report date
    report_date = _safe_get(investor, "report_date", datetime.now().strftime("%d-%b-%Y"))
    canvas.setFont(FONT_SANS, 12)
    canvas.setFillColor(_hex_to_color("#C7D2E8"))
    canvas.drawCentredString(PAGE_W / 2, y - 22 * mm, f"Report Date: {report_date}")

    # PAN (masked)
    pan = _safe_get(investor, "pan", "")
    if pan and len(pan) >= 4:
        masked_pan = pan[:2] + "*" * (len(pan) - 4) + pan[-2:]
        canvas.drawCentredString(PAGE_W / 2, y - 32 * mm, f"PAN: {masked_pan}")

    # Folio count
    folio_count = _safe_get(investor, "folio_count", 0)
    if folio_count:
        canvas.drawCentredString(
            PAGE_W / 2, y - 42 * mm,
            f"Folios: {folio_count}",
        )

    # Bottom section: company details
    bottom_y = 50 * mm
    canvas.setFont(FONT_SANS, 8)
    canvas.setFillColor(_hex_to_color("#8096BC"))
    canvas.drawCentredString(PAGE_W / 2, bottom_y + 14 * mm, COMPANY_NAME)
    canvas.drawCentredString(PAGE_W / 2, bottom_y + 8 * mm, f"{ARN}  |  EUIN: {EUIN}")
    canvas.drawCentredString(PAGE_W / 2, bottom_y + 2 * mm, f"CIN: {CIN}")

    # Very bottom: AMFI disclaimer
    canvas.setFont(FONT_SANS, 6)
    canvas.setFillColor(_hex_to_color("#6B7280"))
    canvas.drawCentredString(
        PAGE_W / 2, 16 * mm,
        AMFI_FOOTER,
    )

    canvas.restoreState()


# =============================================================================
# DISCLAIMER PAGE
# =============================================================================

def _build_disclaimer_elements(styles: dict) -> list:
    """Build flowable elements for the disclaimer page."""
    elements = []

    elements.append(Paragraph("Important Disclaimer", styles["h1"]))
    elements.append(Spacer(1, 2 * mm))

    # Split disclaimer into paragraphs
    for para_text in DISCLAIMER_FULL.strip().split("\n\n"):
        para_text = para_text.strip()
        if para_text:
            elements.append(Paragraph(para_text, styles["disclaimer"]))

    elements.append(Spacer(1, 4 * mm))
    elements.append(
        HRFlowable(
            width="100%", thickness=0.5,
            color=_hex_to_color(BORDER), spaceAfter=4 * mm,
        )
    )

    elements.append(Paragraph("Commission Disclosure", styles["h2"]))
    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph(COMMISSION_DISCLOSURE.strip(), styles["disclaimer"]))

    elements.append(Spacer(1, 4 * mm))
    elements.append(
        HRFlowable(
            width="100%", thickness=0.5,
            color=_hex_to_color(BORDER), spaceAfter=4 * mm,
        )
    )

    # SEBI SCORES reference
    elements.append(Paragraph("Grievance Redressal", styles["h2"]))
    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph(
        "Investors can lodge complaints on SEBI SCORES portal: "
        '<font color="#2E5299"><u>https://scores.sebi.gov.in</u></font>. '
        "AMFI registration details can be verified at "
        '<font color="#2E5299"><u>www.amfiindia.com</u></font>.',
        styles["disclaimer"],
    ))

    elements.append(PageBreak())
    return elements


# =============================================================================
# KPI CARD HELPER
# =============================================================================

def _make_kpi_card(
    value_text: str,
    label_text: str,
    value_color: str = NAVY,
    width: float = 80 * mm,
    height: float = 28 * mm,
) -> Table:
    """Create a single KPI card as a Table with background."""
    style_val = ParagraphStyle(
        "kpi_v",
        fontName=FONT_SANS_BOLD,
        fontSize=15,
        leading=19,
        textColor=_hex_to_color(value_color),
        alignment=TA_CENTER,
    )
    style_lbl = ParagraphStyle(
        "kpi_l",
        fontName=FONT_SANS,
        fontSize=7.5,
        leading=10,
        textColor=_hex_to_color("#6B7280"),
        alignment=TA_CENTER,
    )

    data = [
        [Paragraph(value_text, style_val)],
        [Paragraph(label_text, style_lbl)],
    ]

    t = Table(data, colWidths=[width], rowHeights=[height * 0.6, height * 0.4])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), _hex_to_color(NAVY_PALE)),
        ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
        ("VALIGN", (0, 0), (-1, 0), "BOTTOM"),
        ("VALIGN", (0, 1), (-1, 1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, 0), 3 * mm),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 2 * mm),
        ("ROUNDEDCORNERS", (0, 0), (-1, -1), [3, 3, 3, 3]),
    ]))
    return t


# =============================================================================
# PORTFOLIO SUMMARY PAGE
# =============================================================================

def _build_summary_elements(
    styles: dict,
    investor: dict,
    funds: list,
    summary: Optional[dict] = None,
) -> list:
    """Build flowable elements for the portfolio summary page."""
    elements = []

    elements.append(Paragraph("Portfolio Summary", styles["h1"]))
    elements.append(Spacer(1, 1 * mm))

    # Calculate summary from funds if not provided
    if summary is None:
        summary = _compute_summary(funds)

    total_invested = _safe_get(summary, "total_invested", 0)
    total_value = _safe_get(summary, "total_value", 0)
    total_gain = _safe_get(summary, "total_gain", total_value - total_invested)
    abs_return = _safe_get(summary, "abs_return")
    xirr_val = _safe_get(summary, "xirr")
    fund_count = _safe_get(summary, "fund_count", len(funds))

    # If abs_return not provided, compute
    if abs_return is None and total_invested > 0:
        abs_return = ((total_value - total_invested) / total_invested) * 100

    gain_color = EMERALD if total_gain >= 0 else CRIMSON

    # Investor info bar
    inv_name = _safe_get(investor, "name", "Investor")
    inv_pan = _safe_get(investor, "pan", "")
    inv_mobile = _safe_get(investor, "mobile", "")
    inv_email = _safe_get(investor, "email", "")
    report_date = _safe_get(investor, "report_date", "")

    info_text = f"<b>{inv_name}</b>"
    if inv_pan:
        info_text += f"  |  PAN: {inv_pan}"
    if report_date:
        info_text += f"  |  As on: {report_date}"

    elements.append(Paragraph(info_text, styles["body"]))
    elements.append(Spacer(1, 3 * mm))

    # KPI Cards — 3 across in 2 rows
    card_w = (CONTENT_W - 8 * mm) / 3

    row1_cards = [
        _make_kpi_card(_format_inr(total_invested), "Total Invested", NAVY, card_w),
        _make_kpi_card(_format_inr(total_value), "Current Value", NAVY, card_w),
        _make_kpi_card(
            _format_inr(total_gain),
            "Total Gain / Loss",
            gain_color,
            card_w,
        ),
    ]

    row2_cards = [
        _make_kpi_card(
            _format_pct(abs_return) if abs_return is not None else "--",
            "Absolute Return",
            gain_color,
            card_w,
        ),
        _make_kpi_card(
            _format_pct(xirr_val) if xirr_val is not None else "--",
            "XIRR (Annualized)",
            NAVY if (xirr_val or 0) >= 0 else CRIMSON,
            card_w,
        ),
        _make_kpi_card(
            str(fund_count or len(funds)),
            "Funds Held",
            NAVY,
            card_w,
        ),
    ]

    kpi_row1 = Table([row1_cards], colWidths=[card_w + 2.5 * mm] * 3)
    kpi_row1.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(kpi_row1)
    elements.append(Spacer(1, 3 * mm))

    kpi_row2 = Table([row2_cards], colWidths=[card_w + 2.5 * mm] * 3)
    kpi_row2.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(kpi_row2)

    elements.append(Spacer(1, 6 * mm))

    # Summary Table
    elements.append(Paragraph("Fund-wise Overview", styles["h2"]))
    elements.append(Spacer(1, 1 * mm))

    header_row = [
        Paragraph("Fund Name", styles["table_header"]),
        Paragraph("Category", styles["table_header_center"]),
        Paragraph("Invested", styles["table_header_right"]),
        Paragraph("Value", styles["table_header_right"]),
        Paragraph("Gain", styles["table_header_right"]),
        Paragraph("XIRR", styles["table_header_center"]),
        Paragraph("Action", styles["table_header_center"]),
    ]

    col_widths = [
        CONTENT_W * 0.26,  # Fund Name
        CONTENT_W * 0.14,  # Category
        CONTENT_W * 0.14,  # Invested
        CONTENT_W * 0.14,  # Value
        CONTENT_W * 0.12,  # Gain
        CONTENT_W * 0.10,  # XIRR
        CONTENT_W * 0.10,  # Action
    ]

    table_data = [header_row]

    for fund in funds:
        fname = _safe_get(fund, "name", "Unknown Fund")
        cat = _safe_get(fund, "category", "--")
        invested = _safe_get(fund, "invested", 0)
        value = _safe_get(fund, "value", 0)
        gain = value - invested if (invested and value) else 0
        xirr = _safe_get(fund, "xirr")
        action = _safe_get(fund, "action", "HOLD")
        g_color = _gain_color(gain)
        a_color = _action_badge_color(action)

        row = [
            Paragraph(_truncate(fname, 35), styles["table_cell_bold"]),
            Paragraph(cat, styles["table_cell_center"]),
            Paragraph(_format_inr(invested), styles["table_cell_right"]),
            Paragraph(_format_inr(value), styles["table_cell_right"]),
            Paragraph(
                f'<font color="{g_color}">{_format_inr(gain)}</font>',
                styles["table_cell_right"],
            ),
            Paragraph(
                _format_pct(xirr) if xirr is not None else "--",
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font color="{a_color}"><b>{action}</b></font>',
                styles["table_cell_center"],
            ),
        ]
        table_data.append(row)

    # Total row
    total_gain = total_value - total_invested
    t_g_color = _gain_color(total_gain)
    total_row = [
        Paragraph("<b>TOTAL</b>", styles["table_cell_bold"]),
        Paragraph("", styles["table_cell_center"]),
        Paragraph(f"<b>{_format_inr(total_invested)}</b>", styles["table_cell_right"]),
        Paragraph(f"<b>{_format_inr(total_value)}</b>", styles["table_cell_right"]),
        Paragraph(
            f'<font color="{t_g_color}"><b>{_format_inr(total_gain)}</b></font>',
            styles["table_cell_right"],
        ),
        Paragraph(
            f"<b>{_format_pct(xirr_val)}</b>" if xirr_val is not None else "--",
            styles["table_cell_center"],
        ),
        Paragraph("", styles["table_cell_center"]),
    ]
    table_data.append(total_row)

    t = Table(table_data, colWidths=col_widths, repeatRows=1)

    # Table styling
    style_cmds = [
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), _hex_to_color(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex_to_color(WHITE)),

        # Total row
        ("BACKGROUND", (0, -1), (-1, -1), _hex_to_color(NAVY_PALE)),
        ("LINEABOVE", (0, -1), (-1, -1), 1, _hex_to_color(NAVY)),

        # Borders and padding
        ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
        ("LINEBELOW", (0, 0), (-1, 0), 1, _hex_to_color(NAVY)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
    ]

    # Alternate row backgrounds
    for i in range(1, len(table_data) - 1):
        if i % 2 == 0:
            style_cmds.append(
                ("BACKGROUND", (0, i), (-1, i), _hex_to_color(BG))
            )

    # Horizontal grid lines
    for i in range(1, len(table_data)):
        style_cmds.append(
            ("LINEBELOW", (0, i), (-1, i), 0.25, _hex_to_color(BORDER))
        )

    t.setStyle(TableStyle(style_cmds))
    elements.append(t)

    elements.append(PageBreak())
    return elements


def _truncate(text: str, max_len: int) -> str:
    """Truncate text with ellipsis if too long."""
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def _compute_summary(funds: list) -> dict:
    """Compute portfolio summary from fund-level data."""
    total_invested = sum(_safe_get(f, "invested", 0) for f in funds)
    total_value = sum(_safe_get(f, "value", 0) for f in funds)
    total_gain = total_value - total_invested
    abs_return = ((total_gain / total_invested) * 100) if total_invested > 0 else 0

    return {
        "total_invested": total_invested,
        "total_value": total_value,
        "total_gain": total_gain,
        "abs_return": round(abs_return, 2),
        "xirr": None,  # Cannot compute XIRR without transaction dates
        "fund_count": len(funds),
    }


# =============================================================================
# CATEGORY ALLOCATION PAGE (PIE CHART)
# =============================================================================

def _build_allocation_elements(styles: dict, funds: list) -> list:
    """Build category allocation pie chart and breakdown table."""
    elements = []

    elements.append(Paragraph("Category Allocation", styles["h1"]))
    elements.append(Spacer(1, 2 * mm))

    # Aggregate by category
    category_totals: Dict[str, float] = {}
    total_value = 0
    for fund in funds:
        cat = _safe_get(fund, "category", "Other")
        val = _safe_get(fund, "value", 0)
        category_totals[cat] = category_totals.get(cat, 0) + val
        total_value += val

    if total_value == 0:
        elements.append(Paragraph(
            "No fund value data available for allocation chart.",
            styles["body"],
        ))
        elements.append(PageBreak())
        return elements

    # Sort by value descending
    sorted_cats = sorted(category_totals.items(), key=lambda x: -x[1])

    # Build visual pie chart using Drawing + colored Rects (legend-style)
    # ReportLab doesn't have a built-in pie in platypus, so we draw a
    # horizontal stacked bar with a legend as a visual allocation indicator

    chart_height = 50 * mm
    chart_width = CONTENT_W
    d = Drawing(chart_width, chart_height)

    # Stacked horizontal bar
    bar_y = 28 * mm
    bar_height = 16 * mm
    x_offset = 0

    for idx, (cat, val) in enumerate(sorted_cats):
        pct = val / total_value
        bar_w = max(pct * chart_width, 2)  # Minimum 2pt width
        color_hex = PIE_PALETTE[idx % len(PIE_PALETTE)]

        d.add(Rect(
            x_offset, bar_y, bar_w, bar_height,
            fillColor=_hex_to_color(color_hex),
            strokeColor=_hex_to_color(WHITE),
            strokeWidth=1,
        ))

        # Add percentage label if segment is wide enough
        if bar_w > 30:
            d.add(String(
                x_offset + bar_w / 2, bar_y + bar_height / 2 - 3,
                f"{pct * 100:.0f}%",
                fontSize=7,
                fillColor=_hex_to_color(WHITE),
                fontName=FONT_SANS_BOLD,
                textAnchor="middle",
            ))

        x_offset += bar_w

    # Legend items below the bar
    legend_y = 18 * mm
    legend_x = 0
    legend_col_width = chart_width / 3
    items_per_row = 3

    for idx, (cat, val) in enumerate(sorted_cats):
        pct = val / total_value * 100
        color_hex = PIE_PALETTE[idx % len(PIE_PALETTE)]

        col = idx % items_per_row
        row = idx // items_per_row
        lx = col * legend_col_width
        ly = legend_y - row * 10 * mm

        # Color swatch
        d.add(Rect(
            lx, ly, 8, 8,
            fillColor=_hex_to_color(color_hex),
            strokeColor=None,
            strokeWidth=0,
        ))

        # Label
        label = f"{cat} ({pct:.1f}%)"
        if len(label) > 30:
            label = label[:27] + "..."
        d.add(String(
            lx + 12, ly + 1,
            label,
            fontSize=6.5,
            fillColor=_hex_to_color(INK),
            fontName=FONT_SANS,
        ))

    # Adjust drawing height based on legend rows
    num_rows = math.ceil(len(sorted_cats) / items_per_row)
    actual_height = 35 * mm + num_rows * 10 * mm
    d.height = actual_height

    elements.append(d)
    elements.append(Spacer(1, 4 * mm))

    # Detailed allocation table
    elements.append(Paragraph("Allocation Breakdown", styles["h2"]))
    elements.append(Spacer(1, 1 * mm))

    alloc_header = [
        Paragraph("Category", styles["table_header"]),
        Paragraph("Funds", styles["table_header_center"]),
        Paragraph("Invested", styles["table_header_right"]),
        Paragraph("Current Value", styles["table_header_right"]),
        Paragraph("Allocation %", styles["table_header_center"]),
    ]

    alloc_col_widths = [
        CONTENT_W * 0.30,
        CONTENT_W * 0.10,
        CONTENT_W * 0.22,
        CONTENT_W * 0.22,
        CONTENT_W * 0.16,
    ]

    alloc_data = [alloc_header]

    # Also compute invested by category
    cat_invested: Dict[str, float] = {}
    cat_count: Dict[str, int] = {}
    for fund in funds:
        cat = _safe_get(fund, "category", "Other")
        cat_invested[cat] = cat_invested.get(cat, 0) + _safe_get(fund, "invested", 0)
        cat_count[cat] = cat_count.get(cat, 0) + 1

    for idx, (cat, val) in enumerate(sorted_cats):
        pct = val / total_value * 100
        inv = cat_invested.get(cat, 0)
        cnt = cat_count.get(cat, 0)

        row = [
            Paragraph(f"<b>{cat}</b>", styles["table_cell"]),
            Paragraph(str(cnt), styles["table_cell_center"]),
            Paragraph(_format_inr(inv), styles["table_cell_right"]),
            Paragraph(_format_inr(val), styles["table_cell_right"]),
            Paragraph(f"{pct:.1f}%", styles["table_cell_center"]),
        ]
        alloc_data.append(row)

    # Total
    total_invested = sum(cat_invested.values())
    alloc_data.append([
        Paragraph("<b>TOTAL</b>", styles["table_cell_bold"]),
        Paragraph(f"<b>{len(funds)}</b>", styles["table_cell_center"]),
        Paragraph(f"<b>{_format_inr(total_invested)}</b>", styles["table_cell_right"]),
        Paragraph(f"<b>{_format_inr(total_value)}</b>", styles["table_cell_right"]),
        Paragraph("<b>100.0%</b>", styles["table_cell_center"]),
    ])

    at = Table(alloc_data, colWidths=alloc_col_widths, repeatRows=1)

    alloc_style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _hex_to_color(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex_to_color(WHITE)),
        ("BACKGROUND", (0, -1), (-1, -1), _hex_to_color(NAVY_PALE)),
        ("LINEABOVE", (0, -1), (-1, -1), 1, _hex_to_color(NAVY)),
        ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
        ("LINEBELOW", (0, 0), (-1, 0), 1, _hex_to_color(NAVY)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
    ]

    for i in range(1, len(alloc_data) - 1):
        if i % 2 == 0:
            alloc_style_cmds.append(
                ("BACKGROUND", (0, i), (-1, i), _hex_to_color(BG))
            )
        alloc_style_cmds.append(
            ("LINEBELOW", (0, i), (-1, i), 0.25, _hex_to_color(BORDER))
        )

    at.setStyle(TableStyle(alloc_style_cmds))
    elements.append(at)

    elements.append(PageBreak())
    return elements


# =============================================================================
# FUND-BY-FUND ANALYSIS PAGES
# =============================================================================

def _build_fund_detail_elements(styles: dict, funds: list) -> list:
    """Build detailed fund-by-fund analysis elements."""
    elements = []

    elements.append(Paragraph("Fund-by-Fund Analysis", styles["h1"]))
    elements.append(Spacer(1, 2 * mm))

    if not funds:
        elements.append(Paragraph(
            "No funds to display in the portfolio.",
            styles["body"],
        ))
        elements.append(PageBreak())
        return elements

    for idx, fund in enumerate(funds):
        fund_elements = _build_single_fund_block(styles, fund, idx + 1)
        # Use KeepTogether so a single fund block doesn't split across pages
        # But with CondPageBreak to ensure there's enough room
        elements.append(CondPageBreak(60 * mm))
        elements.extend(fund_elements)

    elements.append(PageBreak())
    return elements


def _build_single_fund_block(styles: dict, fund: dict, seq: int) -> list:
    """Build elements for a single fund analysis block."""
    block = []

    fname = _safe_get(fund, "name", "Unknown Fund")
    amc = _safe_get(fund, "amc", "")
    category = _safe_get(fund, "category", "--")
    plan = _safe_get(fund, "plan", "--")
    folio = _safe_get(fund, "folio", "--")
    units = _safe_get(fund, "units")
    nav = _safe_get(fund, "nav")
    invested = _safe_get(fund, "invested", 0)
    value = _safe_get(fund, "value", 0)
    abs_return = _safe_get(fund, "abs_return")
    xirr = _safe_get(fund, "xirr")
    action = _safe_get(fund, "action", "HOLD")
    since = _safe_get(fund, "since", "")
    analysis = _safe_get(fund, "analysis", "")
    lock_in = _safe_get(fund, "lock_in", False)
    lock_in_until = _safe_get(fund, "lock_in_until")

    gain = value - invested if (invested is not None and value is not None) else 0
    gain_color = _gain_color(gain)
    action_color = _action_badge_color(action)

    # Fund header with sequence number and action badge
    header_text = (
        f'<font color="{NAVY}"><b>#{seq}. {fname}</b></font>'
    )
    if amc:
        header_text += f'  <font size="7" color="#6B7280">({amc})</font>'

    block.append(Paragraph(header_text, styles["fund_name"]))

    # Meta line: category, plan, folio, since
    meta_parts = []
    if category and category != "--":
        meta_parts.append(f"Category: {category}")
    if plan and plan != "--":
        meta_parts.append(f"Plan: {plan}")
    if folio and folio != "--":
        meta_parts.append(f"Folio: {folio}")
    if since:
        meta_parts.append(f"Since: {since}")
    if lock_in:
        lock_text = "Lock-in: Yes"
        if lock_in_until:
            lock_text += f" (until {lock_in_until})"
        meta_parts.append(lock_text)

    if meta_parts:
        block.append(Paragraph("  |  ".join(meta_parts), styles["fund_meta"]))

    block.append(Spacer(1, 1.5 * mm))

    # Fund metrics table
    metrics_data = [
        [
            Paragraph("Units", styles["table_header_center"]),
            Paragraph("NAV", styles["table_header_center"]),
            Paragraph("Invested", styles["table_header_center"]),
            Paragraph("Current Value", styles["table_header_center"]),
            Paragraph("Gain / Loss", styles["table_header_center"]),
            Paragraph("Abs. Return", styles["table_header_center"]),
            Paragraph("XIRR", styles["table_header_center"]),
            Paragraph("Action", styles["table_header_center"]),
        ],
        [
            Paragraph(
                _format_units(units) if units else "--",
                styles["table_cell_center"],
            ),
            Paragraph(
                _format_nav(nav) if nav else "--",
                styles["table_cell_center"],
            ),
            Paragraph(_format_inr(invested), styles["table_cell_center"]),
            Paragraph(_format_inr(value), styles["table_cell_center"]),
            Paragraph(
                f'<font color="{gain_color}"><b>{_format_inr(gain)}</b></font>',
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font color="{gain_color}">{_format_pct(abs_return)}</font>'
                if abs_return is not None else "--",
                styles["table_cell_center"],
            ),
            Paragraph(
                _format_pct(xirr) if xirr is not None else "--",
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font color="{action_color}"><b>{action}</b></font>',
                styles["table_cell_center"],
            ),
        ],
    ]

    metric_col_w = CONTENT_W / 8
    mt = Table(
        metrics_data,
        colWidths=[metric_col_w] * 8,
        repeatRows=1,
    )
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _hex_to_color(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex_to_color(WHITE)),
        ("BACKGROUND", (0, 1), (-1, 1), _hex_to_color(NAVY_PALE)),
        ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
        ("LINEBELOW", (0, 0), (-1, 0), 1, _hex_to_color(NAVY)),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, _hex_to_color(BORDER)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 1 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1 * mm),
    ]))
    block.append(mt)

    # Analysis text
    if analysis:
        # Add action icon prefix
        action_label = {
            "HOLD": "HOLD",
            "SWITCH": "SWITCH",
            "REVIEW": "REVIEW",
            "EXIT": "EXIT",
            "ADD": "ADD",
        }.get(action.upper(), action)

        analysis_line = (
            f'<font color="{action_color}"><b>[{action_label}]</b></font> '
            f"{analysis}"
        )
        block.append(Paragraph(analysis_line, styles["analysis_text"]))

    # Separator
    block.append(Spacer(1, 1 * mm))
    block.append(
        HRFlowable(
            width="100%", thickness=0.3,
            color=_hex_to_color(BORDER), spaceAfter=3 * mm,
        )
    )

    return block


# =============================================================================
# REBALANCING RECOMMENDATIONS PAGE
# =============================================================================

def _build_rebalancing_elements(styles: dict, funds: list) -> list:
    """Build rebalancing recommendations for SWITCH/REVIEW/EXIT funds."""
    elements = []

    elements.append(Paragraph("Rebalancing Recommendations", styles["h1"]))
    elements.append(Spacer(1, 2 * mm))

    # Filter funds needing action
    action_funds = [
        f for f in funds
        if _safe_get(f, "action", "HOLD").upper() in ("SWITCH", "REVIEW", "EXIT")
    ]

    if not action_funds:
        elements.append(Paragraph(
            "All funds in the portfolio are rated <b>HOLD</b>. "
            "No rebalancing action is recommended at this time.",
            styles["body"],
        ))
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph(
            "Continue your SIPs and review again in 6 months, or when "
            "market conditions change significantly.",
            styles["body"],
        ))
        elements.append(PageBreak())
        return elements

    elements.append(Paragraph(
        f"<b>{len(action_funds)}</b> fund(s) require attention based on the "
        "MeraSIP rebalancing framework.",
        styles["body"],
    ))
    elements.append(Spacer(1, 3 * mm))

    # Recommendations table
    rec_header = [
        Paragraph("#", styles["table_header_center"]),
        Paragraph("Fund Name", styles["table_header"]),
        Paragraph("Category", styles["table_header_center"]),
        Paragraph("Invested", styles["table_header_right"]),
        Paragraph("Value", styles["table_header_right"]),
        Paragraph("Return", styles["table_header_center"]),
        Paragraph("Action", styles["table_header_center"]),
    ]

    rec_col_widths = [
        CONTENT_W * 0.05,
        CONTENT_W * 0.30,
        CONTENT_W * 0.13,
        CONTENT_W * 0.14,
        CONTENT_W * 0.14,
        CONTENT_W * 0.12,
        CONTENT_W * 0.12,
    ]

    rec_data = [rec_header]

    for idx, fund in enumerate(action_funds, 1):
        fname = _safe_get(fund, "name", "Unknown")
        cat = _safe_get(fund, "category", "--")
        invested = _safe_get(fund, "invested", 0)
        value = _safe_get(fund, "value", 0)
        abs_return = _safe_get(fund, "abs_return")
        action = _safe_get(fund, "action", "REVIEW")
        a_color = _action_badge_color(action)
        r_color = _gain_color(abs_return) if abs_return is not None else INK

        row = [
            Paragraph(str(idx), styles["table_cell_center"]),
            Paragraph(_truncate(fname, 40), styles["table_cell_bold"]),
            Paragraph(cat, styles["table_cell_center"]),
            Paragraph(_format_inr(invested), styles["table_cell_right"]),
            Paragraph(_format_inr(value), styles["table_cell_right"]),
            Paragraph(
                f'<font color="{r_color}">{_format_pct(abs_return)}</font>'
                if abs_return is not None else "--",
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font color="{a_color}"><b>{action}</b></font>',
                styles["table_cell_center"],
            ),
        ]
        rec_data.append(row)

    rt = Table(rec_data, colWidths=rec_col_widths, repeatRows=1)

    rec_style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _hex_to_color(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex_to_color(WHITE)),
        ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
        ("LINEBELOW", (0, 0), (-1, 0), 1, _hex_to_color(NAVY)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
    ]

    for i in range(1, len(rec_data)):
        if i % 2 == 0:
            rec_style_cmds.append(
                ("BACKGROUND", (0, i), (-1, i), _hex_to_color(BG))
            )
        rec_style_cmds.append(
            ("LINEBELOW", (0, i), (-1, i), 0.25, _hex_to_color(BORDER))
        )

    rt.setStyle(TableStyle(rec_style_cmds))
    elements.append(rt)

    elements.append(Spacer(1, 4 * mm))

    # Per-fund recommendation detail
    elements.append(Paragraph("Detailed Recommendations", styles["h2"]))
    elements.append(Spacer(1, 2 * mm))

    for idx, fund in enumerate(action_funds, 1):
        fname = _safe_get(fund, "name", "Unknown")
        action = _safe_get(fund, "action", "REVIEW")
        analysis = _safe_get(fund, "analysis", "")
        action_detail = _safe_get(fund, "action_detail", "")
        a_color = _action_badge_color(action)

        rec_block = []

        rec_block.append(Paragraph(
            f'<font color="{a_color}"><b>[{action}]</b></font> '
            f'<b>{fname}</b>',
            styles["body"],
        ))

        if analysis:
            rec_block.append(Paragraph(analysis, styles["analysis_text"]))

        if action_detail:
            rec_block.append(Paragraph(
                f'<font color="{NAVY_DIM}">Suggested alternative: '
                f'<b>{action_detail}</b></font>',
                styles["body_small"],
            ))

        rec_block.append(Spacer(1, 2 * mm))
        elements.extend(rec_block)

    elements.append(PageBreak())
    return elements


# =============================================================================
# MERASIP SHORTLIST REFERENCE PAGE
# =============================================================================

def _build_shortlist_page(styles: dict) -> list:
    """Build MeraSIP recommended fund shortlist reference page."""
    elements = []

    elements.append(Paragraph("MeraSIP Recommended Fund Shortlist", styles["h1"]))
    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph(
        "The following is the current MeraSIP recommended fund shortlist by category. "
        "Funds are ranked based on a quantitative screening of risk-adjusted returns, "
        "AUM stability, fund manager track record, and consistency metrics. "
        "This list is reviewed and updated periodically.",
        styles["body"],
    ))
    elements.append(Spacer(1, 2 * mm))

    shortlist = MERASIP_SHORTLIST

    if not shortlist:
        elements.append(Paragraph(
            "Shortlist data is not available at this time. "
            "Please contact your MeraSIP advisor for the latest recommendations.",
            styles["body"],
        ))
        elements.append(PageBreak())
        return elements

    # Build a table for each category
    for cat_name, cat_funds in shortlist.items():
        if not cat_funds:
            continue

        elements.append(CondPageBreak(20 * mm))
        elements.append(Paragraph(cat_name, styles["shortlist_cat"]))

        for fund_entry in cat_funds:
            rank = fund_entry.get("rank", "-")
            name = fund_entry.get("name", "")
            ret_5y = fund_entry.get("5y_return")
            ret_3y = fund_entry.get("3y_return")
            aum = fund_entry.get("aum_cr")

            detail_parts = [f"#{rank}. <b>{name}</b>"]
            extras = []
            if ret_5y:
                extras.append(f"5Y: {ret_5y}%")
            if ret_3y:
                extras.append(f"3Y: {ret_3y}%")
            if aum:
                extras.append(f"AUM: {_format_inr(aum * 1_00_00_000, compact=True)}")

            if extras:
                detail_parts.append(
                    f'  <font size="6.5" color="#6B7280">({", ".join(extras)})</font>'
                )

            elements.append(Paragraph("".join(detail_parts), styles["shortlist_fund"]))

        elements.append(Spacer(1, 1 * mm))

    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph(
        "<i>Disclaimer: This shortlist is for informational purposes only and does not "
        "constitute investment advice. Past performance is not indicative of future results. "
        "Please consult your financial advisor before making investment decisions.</i>",
        styles["body_small"],
    ))

    elements.append(PageBreak())
    return elements


# =============================================================================
# BACK PAGE
# =============================================================================

def _build_back_page(styles: dict) -> list:
    """Build the final back page with company info and disclaimers."""
    elements = []

    # Large vertical spacer to center content
    elements.append(Spacer(1, 50 * mm))

    elements.append(Paragraph("MeraSIP by Trustner", styles["back_title"]))

    elements.append(Spacer(1, 4 * mm))

    # Company details
    elements.append(Paragraph(
        f"<b>{COMPANY_NAME}</b>",
        styles["back_detail"],
    ))
    elements.append(Paragraph(ADDRESS, styles["back_detail"]))

    elements.append(Spacer(1, 3 * mm))

    # Contact info table
    contact_data = [
        [
            Paragraph(f"<b>Phone:</b> {PHONE}", styles["body_center"]),
            Paragraph(f"<b>Email:</b> {EMAIL}", styles["body_center"]),
        ],
        [
            Paragraph(f"<b>Web:</b> {WEB}", styles["body_center"]),
            Paragraph(f"<b>ARN:</b> {ARN}", styles["body_center"]),
        ],
        [
            Paragraph(f"<b>EUIN:</b> {EUIN}", styles["body_center"]),
            Paragraph(f"<b>CIN:</b> {CIN}", styles["body_center"]),
        ],
    ]

    ct = Table(contact_data, colWidths=[CONTENT_W / 2] * 2)
    ct.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5 * mm),
    ]))
    elements.append(ct)

    elements.append(Spacer(1, 6 * mm))

    # Regulatory references
    elements.append(
        HRFlowable(
            width="60%", thickness=0.5,
            color=_hex_to_color(BORDER), spaceAfter=4 * mm,
        )
    )

    elements.append(Paragraph(
        "AMFI Registered Mutual Fund Distributor",
        styles["body_center"],
    ))
    elements.append(Paragraph(
        "www.amfiindia.com  |  https://scores.sebi.gov.in",
        styles["body_center"],
    ))

    # Big disclaimer
    elements.append(Paragraph(
        "Mutual fund investments are subject to market risks. "
        "Read all scheme related documents carefully.",
        styles["back_disclaimer"],
    ))

    elements.append(Spacer(1, 6 * mm))

    # Report generation timestamp
    now = datetime.now().strftime("%d-%b-%Y %H:%M")
    elements.append(Paragraph(
        f'<font size="7" color="#9CA3AF">Report generated on {now} by MeraSIP Engine v2.0</font>',
        styles["body_center"],
    ))

    return elements


# =============================================================================
# ADDITIONAL ANALYSIS: HOLDING PERIOD / TOP PERFORMERS
# =============================================================================

def _build_top_performers_section(styles: dict, funds: list) -> list:
    """Build a top/bottom performers section to add depth to the report."""
    elements = []

    if len(funds) < 2:
        return elements

    elements.append(Paragraph("Performance Highlights", styles["h2"]))
    elements.append(Spacer(1, 2 * mm))

    # Sort by absolute return
    sorted_by_return = sorted(
        [f for f in funds if _safe_get(f, "abs_return") is not None],
        key=lambda x: x.get("abs_return", 0),
        reverse=True,
    )

    if not sorted_by_return:
        return elements

    # Top performer
    top = sorted_by_return[0]
    top_ret = _safe_get(top, "abs_return", 0)
    if top_ret > 0:
        elements.append(Paragraph(
            f'<font color="{EMERALD}"><b>Best Performer:</b></font> '
            f'{_safe_get(top, "name", "N/A")} with '
            f'{_format_pct(top_ret)} absolute return.',
            styles["body"],
        ))

    # Bottom performer
    bottom = sorted_by_return[-1]
    bottom_ret = _safe_get(bottom, "abs_return", 0)
    if bottom_ret < top_ret:
        b_color = _gain_color(bottom_ret)
        elements.append(Paragraph(
            f'<font color="{b_color}"><b>Weakest Performer:</b></font> '
            f'{_safe_get(bottom, "name", "N/A")} with '
            f'{_format_pct(bottom_ret)} absolute return.',
            styles["body"],
        ))

    # Largest holding by value
    sorted_by_value = sorted(
        funds,
        key=lambda x: _safe_get(x, "value", 0),
        reverse=True,
    )
    largest = sorted_by_value[0]
    total_val = sum(_safe_get(f, "value", 0) for f in funds)
    if total_val > 0:
        lv = _safe_get(largest, "value", 0)
        pct = lv / total_val * 100
        elements.append(Paragraph(
            f'<b>Largest Holding:</b> '
            f'{_safe_get(largest, "name", "N/A")} at '
            f'{_format_inr(lv)} ({pct:.1f}% of portfolio).',
            styles["body"],
        ))

    elements.append(Spacer(1, 3 * mm))
    return elements


# =============================================================================
# ACTION LEGEND
# =============================================================================

def _build_action_legend(styles: dict) -> list:
    """Build a small legend explaining action badges."""
    elements = []

    elements.append(Paragraph("Action Legend", styles["h3"]))

    legend_items = [
        ("HOLD", EMERALD,
         "Fund is performing well and is in the MeraSIP recommended list. Continue holding."),
        ("REVIEW", AMBER,
         "Fund needs review. It may not be in the recommended list or has category overlap."),
        ("SWITCH", CRIMSON,
         "Fund is underperforming. Consider switching to the recommended alternative."),
        ("EXIT", CRIMSON,
         "Fund should be exited. It is significantly underperforming or has structural issues."),
    ]

    for action, color, desc in legend_items:
        elements.append(Paragraph(
            f'<font color="{color}"><b>[{action}]</b></font> '
            f'<font size="7.5">{desc}</font>',
            styles["body_small"],
        ))

    elements.append(Spacer(1, 3 * mm))
    return elements


# =============================================================================
# HOLDING PERIOD ANALYSIS
# =============================================================================

def _build_holding_analysis_section(styles: dict, funds: list) -> list:
    """Build holding period analysis section."""
    elements = []

    funds_with_since = [f for f in funds if _safe_get(f, "since")]
    if not funds_with_since:
        return elements

    elements.append(Paragraph("Holding Period Analysis", styles["h2"]))
    elements.append(Spacer(1, 2 * mm))

    now_year = datetime.now().year

    # Group by vintage
    short_term = []  # < 3 years
    medium_term = []  # 3-5 years
    long_term = []  # > 5 years

    for fund in funds_with_since:
        since = _safe_get(fund, "since", "")
        try:
            year = int(since)
            years = now_year - year
            if years < 3:
                short_term.append(fund)
            elif years <= 5:
                medium_term.append(fund)
            else:
                long_term.append(fund)
        except (ValueError, TypeError):
            pass

    holding_data = [
        [
            Paragraph("Holding Period", styles["table_header"]),
            Paragraph("Funds", styles["table_header_center"]),
            Paragraph("Invested", styles["table_header_right"]),
            Paragraph("Current Value", styles["table_header_right"]),
        ],
    ]

    for label, group in [
        ("< 3 Years", short_term),
        ("3 \u2013 5 Years", medium_term),
        ("> 5 Years", long_term),
    ]:
        if group:
            inv = sum(_safe_get(f, "invested", 0) for f in group)
            val = sum(_safe_get(f, "value", 0) for f in group)
            holding_data.append([
                Paragraph(label, styles["table_cell"]),
                Paragraph(str(len(group)), styles["table_cell_center"]),
                Paragraph(_format_inr(inv), styles["table_cell_right"]),
                Paragraph(_format_inr(val), styles["table_cell_right"]),
            ])

    if len(holding_data) > 1:
        hcol_w = [
            CONTENT_W * 0.30,
            CONTENT_W * 0.20,
            CONTENT_W * 0.25,
            CONTENT_W * 0.25,
        ]
        ht = Table(holding_data, colWidths=hcol_w, repeatRows=1)
        ht.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), _hex_to_color(NAVY)),
            ("TEXTCOLOR", (0, 0), (-1, 0), _hex_to_color(WHITE)),
            ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
            ("LINEBELOW", (0, 0), (-1, 0), 1, _hex_to_color(NAVY)),
            ("INNERGRID", (0, 1), (-1, -1), 0.25, _hex_to_color(BORDER)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
            ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ]))
        elements.append(ht)
        elements.append(Spacer(1, 3 * mm))

    return elements


# =============================================================================
# PLAN-TYPE ANALYSIS (Regular vs Direct)
# =============================================================================

def _build_plan_analysis_section(styles: dict, funds: list) -> list:
    """Build analysis of Regular vs Direct plan distribution."""
    elements = []

    regular = [f for f in funds if _safe_get(f, "plan", "").lower() == "regular"]
    direct = [f for f in funds if _safe_get(f, "plan", "").lower() == "direct"]

    if not regular and not direct:
        return elements

    elements.append(Paragraph("Plan-Type Distribution", styles["h2"]))
    elements.append(Spacer(1, 2 * mm))

    plan_data = [
        [
            Paragraph("Plan Type", styles["table_header"]),
            Paragraph("Funds", styles["table_header_center"]),
            Paragraph("Invested", styles["table_header_right"]),
            Paragraph("Current Value", styles["table_header_right"]),
        ],
    ]

    for label, group in [("Regular", regular), ("Direct", direct)]:
        if group:
            inv = sum(_safe_get(f, "invested", 0) for f in group)
            val = sum(_safe_get(f, "value", 0) for f in group)
            plan_data.append([
                Paragraph(label, styles["table_cell"]),
                Paragraph(str(len(group)), styles["table_cell_center"]),
                Paragraph(_format_inr(inv), styles["table_cell_right"]),
                Paragraph(_format_inr(val), styles["table_cell_right"]),
            ])

    if len(plan_data) > 1:
        pcol_w = [
            CONTENT_W * 0.30,
            CONTENT_W * 0.20,
            CONTENT_W * 0.25,
            CONTENT_W * 0.25,
        ]
        pt = Table(plan_data, colWidths=pcol_w, repeatRows=1)
        pt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), _hex_to_color(NAVY)),
            ("TEXTCOLOR", (0, 0), (-1, 0), _hex_to_color(WHITE)),
            ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
            ("LINEBELOW", (0, 0), (-1, 0), 1, _hex_to_color(NAVY)),
            ("INNERGRID", (0, 1), (-1, -1), 0.25, _hex_to_color(BORDER)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
            ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ]))
        elements.append(pt)
        elements.append(Spacer(1, 3 * mm))

    return elements


# =============================================================================
# PORTFOLIO RISK COMMENTARY
# =============================================================================

def _build_risk_commentary(styles: dict, funds: list) -> list:
    """Generate risk commentary based on portfolio composition."""
    elements = []

    if not funds:
        return elements

    elements.append(Paragraph("Portfolio Risk Commentary", styles["h2"]))
    elements.append(Spacer(1, 2 * mm))

    total_value = sum(_safe_get(f, "value", 0) for f in funds)
    if total_value == 0:
        return elements

    # Categorize by risk
    high_risk_cats = {"Small Cap", "Sectoral", "Thematic", "Mid Cap"}
    moderate_cats = {"Flexi Cap", "Multi Cap", "Large & Mid Cap", "Focused"}
    low_risk_cats = {
        "Large Cap", "Balanced Advantage", "Aggressive Hybrid",
        "Conservative Hybrid", "Equity Savings", "FOF / Multi Asset",
        "Debt", "Liquid", "Arbitrage",
    }

    high_val = 0
    mod_val = 0
    low_val = 0

    for fund in funds:
        cat = _safe_get(fund, "category", "Other")
        val = _safe_get(fund, "value", 0)
        if cat in high_risk_cats:
            high_val += val
        elif cat in moderate_cats:
            mod_val += val
        elif cat in low_risk_cats:
            low_val += val
        else:
            mod_val += val  # Default to moderate

    high_pct = high_val / total_value * 100 if total_value > 0 else 0
    mod_pct = mod_val / total_value * 100 if total_value > 0 else 0
    low_pct = low_val / total_value * 100 if total_value > 0 else 0

    # Risk meter visual
    risk_data = [
        [
            Paragraph("High Risk", styles["table_header_center"]),
            Paragraph("Moderate Risk", styles["table_header_center"]),
            Paragraph("Low Risk", styles["table_header_center"]),
        ],
        [
            Paragraph(
                f'<font color="{CRIMSON}"><b>{high_pct:.1f}%</b></font>',
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font color="{AMBER}"><b>{mod_pct:.1f}%</b></font>',
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font color="{EMERALD}"><b>{low_pct:.1f}%</b></font>',
                styles["table_cell_center"],
            ),
        ],
        [
            Paragraph(
                f'<font size="6.5">(Small/Mid/Sectoral)</font>',
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font size="6.5">(Flexi/Multi/L&M Cap)</font>',
                styles["table_cell_center"],
            ),
            Paragraph(
                f'<font size="6.5">(Large/BAF/Hybrid)</font>',
                styles["table_cell_center"],
            ),
        ],
    ]

    risk_col_w = CONTENT_W / 3
    risk_t = Table(risk_data, colWidths=[risk_col_w] * 3)
    risk_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _hex_to_color(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex_to_color(WHITE)),
        ("BACKGROUND", (0, 1), (-1, -1), _hex_to_color(NAVY_PALE)),
        ("BOX", (0, 0), (-1, -1), 0.5, _hex_to_color(BORDER)),
        ("LINEBELOW", (0, 0), (-1, 0), 1, _hex_to_color(NAVY)),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, _hex_to_color(BORDER)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]))
    elements.append(risk_t)
    elements.append(Spacer(1, 2 * mm))

    # Textual commentary
    commentary_parts = []

    if high_pct > 60:
        commentary_parts.append(
            f"The portfolio has a <b>high-risk tilt</b> with {high_pct:.0f}% allocated to "
            "small-cap, mid-cap, and sectoral funds. This may lead to higher volatility. "
            "Consider adding large-cap or balanced funds for stability."
        )
    elif high_pct > 40:
        commentary_parts.append(
            f"The portfolio has a <b>growth-oriented</b> allocation with {high_pct:.0f}% "
            "in higher-risk categories. This is suitable for investors with a "
            "long-term horizon (7+ years) and high risk tolerance."
        )
    elif low_pct > 60:
        commentary_parts.append(
            f"The portfolio is <b>conservatively positioned</b> with {low_pct:.0f}% in "
            "low-risk categories. While this provides stability, returns may lag inflation "
            "over very long periods. Consider a small allocation to equity-oriented funds."
        )
    else:
        commentary_parts.append(
            "The portfolio has a <b>balanced allocation</b> across risk categories. "
            "This diversified approach helps manage downside risk while participating "
            "in equity market upside."
        )

    # Fund concentration check
    if len(funds) > 0:
        max_fund_val = max(_safe_get(f, "value", 0) for f in funds)
        max_pct = max_fund_val / total_value * 100 if total_value > 0 else 0
        if max_pct > 40:
            max_fund = max(funds, key=lambda f: _safe_get(f, "value", 0))
            commentary_parts.append(
                f"<b>Concentration alert:</b> {_safe_get(max_fund, 'name', 'One fund')} "
                f"constitutes {max_pct:.0f}% of the portfolio. Consider diversifying "
                "to reduce single-fund risk."
            )

    for para in commentary_parts:
        elements.append(Paragraph(para, styles["body"]))

    elements.append(Spacer(1, 3 * mm))
    return elements


# =============================================================================
# MAIN BUILD FUNCTION
# =============================================================================

def build_report(
    output_path: str,
    investor: dict,
    funds: list,
    summary: Optional[dict] = None,
) -> str:
    """
    Build the complete MeraSIP portfolio review PDF report.

    Args:
        output_path: File path where the PDF will be saved.
        investor: Dict with investor details (name, pan, mobile, email, etc.).
        funds: List of fund dicts with performance and analysis data.
        summary: Optional pre-computed portfolio summary. If None, computed from funds.

    Returns:
        The output_path string after successful PDF generation.

    Raises:
        ValueError: If investor data is missing required fields.
        IOError: If the output path is not writable.
    """
    # -------------------------------------------------------------------------
    # Input validation
    # -------------------------------------------------------------------------
    if not investor:
        raise ValueError("Investor data is required to generate the report.")

    if not isinstance(investor, dict):
        raise ValueError("Investor must be a dictionary.")

    if not isinstance(funds, list):
        raise ValueError("Funds must be a list.")

    # Handle edge case: no funds
    if not funds:
        funds = []

    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # -------------------------------------------------------------------------
    # Compute summary if not provided
    # -------------------------------------------------------------------------
    if summary is None:
        summary = _compute_summary(funds)
    else:
        # Fill in missing fields
        if "fund_count" not in summary:
            summary["fund_count"] = len(funds)
        if "total_gain" not in summary:
            ti = _safe_get(summary, "total_invested", 0)
            tv = _safe_get(summary, "total_value", 0)
            summary["total_gain"] = tv - ti

    # -------------------------------------------------------------------------
    # Build paragraph styles
    # -------------------------------------------------------------------------
    styles = _build_styles()

    # -------------------------------------------------------------------------
    # Track pages for the cover (drawn separately on canvas)
    # -------------------------------------------------------------------------
    # We use a custom first-page callback for the cover page and a
    # standard later-page callback for header/footer

    page_counter = {"current": 0}

    def on_first_page(canvas, doc):
        """Draw cover page."""
        page_counter["current"] = 1
        _build_cover_page(canvas, doc, investor)

    def on_later_pages(canvas, doc):
        """Draw header and footer on all subsequent pages."""
        page_counter["current"] += 1
        _header_footer(canvas, doc, page_counter["current"])

    # -------------------------------------------------------------------------
    # Create document
    # -------------------------------------------------------------------------
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP + 6 * mm,  # Extra space for header
        bottomMargin=MARGIN_BOTTOM,
        title=f"MeraSIP Portfolio Review - {_safe_get(investor, 'name', 'Investor')}",
        author=COMPANY_NAME,
        subject="S.M.A.R.T Portfolio Review Report",
        creator="MeraSIP Report Engine v2.0",
    )

    # -------------------------------------------------------------------------
    # Assemble flowable content (pages 2 onward; page 1 is canvas-drawn)
    # -------------------------------------------------------------------------
    story = []

    # The cover page is drawn via on_first_page callback.
    # We need a PageBreak as the first flowable to trigger the transition
    # from first page to subsequent pages.
    story.append(PageBreak())

    # Page 2: Disclaimer
    story.extend(_build_disclaimer_elements(styles))

    # Page 3: Portfolio Summary
    story.extend(_build_summary_elements(styles, investor, funds, summary))

    # Page 4: Category Allocation (Pie Chart + Table)
    if funds:
        story.extend(_build_allocation_elements(styles, funds))

    # Pages 4.5: Performance highlights, risk commentary, holding analysis
    if funds:
        story.extend(_build_action_legend(styles))
        story.extend(_build_top_performers_section(styles, funds))
        story.extend(_build_risk_commentary(styles, funds))
        story.extend(_build_holding_analysis_section(styles, funds))
        story.extend(_build_plan_analysis_section(styles, funds))
        story.append(PageBreak())

    # Pages 5+: Fund-by-Fund Analysis
    if funds:
        story.extend(_build_fund_detail_elements(styles, funds))

    # Rebalancing Recommendations
    if funds:
        story.extend(_build_rebalancing_elements(styles, funds))

    # MeraSIP Shortlist Reference
    story.extend(_build_shortlist_page(styles))

    # Back Page
    story.extend(_build_back_page(styles))

    # -------------------------------------------------------------------------
    # Build PDF
    # -------------------------------------------------------------------------
    doc.build(
        story,
        onFirstPage=on_first_page,
        onLaterPages=on_later_pages,
    )

    return output_path


# =============================================================================
# CONVENIENCE: Generate sample report for testing
# =============================================================================

def _generate_sample_report(output_path: str = "sample_report.pdf") -> str:
    """
    Generate a sample report with test data for development/testing.

    Args:
        output_path: Where to save the sample PDF.

    Returns:
        The output path.
    """
    investor = {
        "name": "Sumermal Jain",
        "pan": "ACCPJ4990L",
        "mobile": "9435028443",
        "email": "Subhamjain468@gmail.com",
        "folio_count": 19,
        "report_date": "17-Feb-2026",
    }

    summary = {
        "total_invested": 2607000,
        "total_value": 3651367,
        "total_gain": 1044367,
        "abs_return": 40.06,
        "xirr": 18.20,
        "fund_count": 19,
    }

    funds = [
        {
            "name": "Nippon India Small Cap Fund",
            "amc": "Nippon India MF",
            "category": "Small Cap",
            "plan": "Regular",
            "folio": "12345678",
            "units": 1234.567,
            "nav": 180.25,
            "invested": 625000,
            "value": 1278000,
            "abs_return": 104.53,
            "xirr": 18.63,
            "action": "HOLD",
            "since": "2019",
            "analysis": (
                "Cornerstone holding -- 104.53% absolute return since 2019. "
                "MeraSIP Shortlist Rank #2 in Small Cap. Continue SIP."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "HDFC Mid Cap Opportunities Fund",
            "amc": "HDFC MF",
            "category": "Mid Cap",
            "plan": "Regular",
            "folio": "23456789",
            "units": 876.432,
            "nav": 210.50,
            "invested": 400000,
            "value": 512000,
            "abs_return": 28.00,
            "xirr": 15.50,
            "action": "HOLD",
            "since": "2021",
            "analysis": (
                "MeraSIP Shortlist Rank #1 in Mid Cap. Strong performer "
                "with 28.00% absolute return. Continue holding."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "ICICI Pru Equity & Debt Fund",
            "amc": "ICICI Pru MF",
            "category": "Aggressive Hybrid",
            "plan": "Regular",
            "folio": "34567890",
            "units": 2345.678,
            "nav": 95.30,
            "invested": 300000,
            "value": 368000,
            "abs_return": 22.67,
            "xirr": 14.20,
            "action": "HOLD",
            "since": "2022",
            "analysis": (
                "MeraSIP Shortlist Rank #1 in Aggressive Hybrid. "
                "Solid risk-adjusted returns. Good diversifier."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "SBI Banking & Financial Services Fund",
            "amc": "SBI MF",
            "category": "Sectoral",
            "plan": "Regular",
            "folio": "45678901",
            "units": 543.210,
            "nav": 130.75,
            "invested": 200000,
            "value": 195000,
            "abs_return": -2.50,
            "xirr": -3.10,
            "action": "REVIEW",
            "since": "2023",
            "analysis": (
                "Sectoral fund. Not in MeraSIP recommended shortlist. "
                "Currently in minor loss. Review allocation."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "HDFC Flexi Cap Fund",
            "amc": "HDFC MF",
            "category": "Flexi Cap",
            "plan": "Regular",
            "folio": "56789012",
            "units": 1567.890,
            "nav": 145.60,
            "invested": 350000,
            "value": 423000,
            "abs_return": 20.86,
            "xirr": 16.40,
            "action": "HOLD",
            "since": "2020",
            "analysis": (
                "MeraSIP Shortlist Rank #1 in Flexi Cap. "
                "Excellent fund manager track record. Core holding."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "Axis ELSS Tax Saver Fund",
            "amc": "Axis MF",
            "category": "ELSS",
            "plan": "Regular",
            "folio": "67890123",
            "units": 789.012,
            "nav": 78.90,
            "invested": 150000,
            "value": 132000,
            "abs_return": -12.00,
            "xirr": -8.50,
            "action": "SWITCH",
            "since": "2024",
            "analysis": (
                "Underperforming at -12.00% in <18 months. "
                "ELSS fund with 3-year lock-in. Note: No 80C benefit "
                "under New Tax Regime. Consider switching post lock-in."
            ),
            "action_detail": "Mirae Asset ELSS Tax Saver Fund",
            "lock_in": True,
            "lock_in_until": "Mar-2027",
        },
        {
            "name": "Parag Parikh Flexi Cap Fund",
            "amc": "PPFAS MF",
            "category": "Flexi Cap",
            "plan": "Regular",
            "folio": "78901234",
            "units": 456.789,
            "nav": 72.30,
            "invested": 120000,
            "value": 148000,
            "abs_return": 23.33,
            "xirr": 17.80,
            "action": "HOLD",
            "since": "2022",
            "analysis": (
                "MeraSIP Shortlist Rank #2 in Flexi Cap. "
                "Unique global diversification. Good compounder."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "Kotak Multicap Fund",
            "amc": "Kotak MF",
            "category": "Multi Cap",
            "plan": "Regular",
            "folio": "89012345",
            "units": 987.654,
            "nav": 52.40,
            "invested": 100000,
            "value": 118000,
            "abs_return": 18.00,
            "xirr": 22.50,
            "action": "HOLD",
            "since": "2024",
            "analysis": (
                "MeraSIP Shortlist Rank #1 in Multi Cap. "
                "Strong early performance. Continue SIP."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "Franklin India Technology Fund",
            "amc": "Franklin Templeton MF",
            "category": "Sectoral",
            "plan": "Regular",
            "folio": "90123456",
            "units": 321.098,
            "nav": 245.60,
            "invested": 112000,
            "value": 105367,
            "abs_return": -5.92,
            "xirr": -4.20,
            "action": "EXIT",
            "since": "2023",
            "analysis": (
                "Sectoral/thematic fund not in MeraSIP recommended list. "
                "Underperforming. Recommend exiting and redeploying to "
                "diversified equity fund."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
        {
            "name": "ICICI Pru Balanced Advantage Fund",
            "amc": "ICICI Pru MF",
            "category": "Balanced Advantage",
            "plan": "Regular",
            "folio": "01234567",
            "units": 1543.210,
            "nav": 62.80,
            "invested": 250000,
            "value": 272000,
            "abs_return": 8.80,
            "xirr": 9.20,
            "action": "HOLD",
            "since": "2021",
            "analysis": (
                "MeraSIP Shortlist Rank #2 in Balanced Advantage. "
                "Stable performer with managed downside. Good for "
                "capital protection."
            ),
            "lock_in": False,
            "lock_in_until": None,
        },
    ]

    return build_report(output_path, investor, funds, summary)


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        out = sys.argv[1]
    else:
        out = "merasip_sample_report.pdf"

    path = _generate_sample_report(out)
    print(f"Sample report generated: {path}")
