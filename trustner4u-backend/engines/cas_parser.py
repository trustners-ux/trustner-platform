"""CAS PDF Parser — extracts portfolio data from CAMS/KFintech/MFCentral and Valuation Reports."""

import re
from typing import Optional

import pdfplumber
from pypdf import PdfReader


# ---------------------------------------------------------------------------
# Maximum pages to extract — prevents OOM on Render 512MB
# Summary data is always on first 3-5 pages; detail pages are not needed
# ---------------------------------------------------------------------------
MAX_PAGES = 8


def parse_cas(pdf_path: str, password: Optional[str] = None) -> dict:
    """
    Parse a CAS / Valuation Report PDF and return structured portfolio data.

    Supports:
    - CAMS CAS
    - KFintech CAS
    - MF Central CAS
    - WealthMagic / MFU / Advisor Valuation Reports

    Args:
        pdf_path: Path to the PDF file
        password: Optional password (usually investor PAN for protected PDFs)

    Returns:
        dict matching IndividualPortfolioSchema
    """
    full_text = _extract_text(pdf_path, password)
    if not full_text or len(full_text.strip()) < 100:
        raise ValueError("Could not extract text from PDF. File may be image-based or corrupted.")

    # Detect format and parse accordingly
    if _is_valuation_report(full_text):
        return _parse_valuation_report(full_text)

    # Standard CAS parsing
    investor = _extract_investor(full_text)
    funds = _extract_funds(full_text)

    # Calculate summary
    total_invested = sum(f["invested"] for f in funds)
    total_value = sum(f["value"] for f in funds)
    total_gain = total_value - total_invested
    abs_return = (total_gain / total_invested * 100) if total_invested > 0 else 0

    return {
        "investor": {
            **investor,
            "folio_count": len(set(f.get("folio", "") for f in funds if f.get("folio"))),
            "report_date": _extract_report_date(full_text),
        },
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_value": round(total_value, 2),
            "total_gain": round(total_gain, 2),
            "abs_return": round(abs_return, 2),
            "xirr": None,
        },
        "funds": funds,
    }


# ===========================================================================
# VALUATION REPORT PARSER (WealthMagic / MFU / Advisor Reports)
# ===========================================================================

def _is_valuation_report(text: str) -> bool:
    """Detect if the PDF is a Valuation Report (not standard CAS)."""
    indicators = [
        r'Valuation\s+Report',
        r'Mutual\s+Fund\s+Family\s+Report',
        r'Scheme\s+Wise\s+Family\s+Investment\s+Summary',
        r'Fund\s+House\s+Wise\s+Family',
        r'AMFI.Registered\s+Mutual\s+Fund\s+Distributor',
    ]
    score = sum(1 for pat in indicators if re.search(pat, text, re.IGNORECASE))
    return score >= 2


def _parse_valuation_report(text: str) -> dict:
    """Parse a Valuation Report / Advisor Report format."""
    investor = _extract_valuation_investor(text)
    funds = _extract_valuation_funds(text)
    family = _extract_family_members(text)

    # Try to get overall XIRR from page 1 summary
    xirr = None
    xirr_match = re.search(
        r'(?:Dividend Payout|XIRR)\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+%\s+([\d.]+)%',
        text
    )
    if not xirr_match:
        xirr_match = re.search(r'XIRR\s*\n\s*([\d.]+)%', text)
    if xirr_match:
        try:
            xirr = float(xirr_match.group(1))
        except ValueError:
            pass

    # Calculate summary from parsed funds
    total_invested = sum(f["invested"] for f in funds)
    total_value = sum(f["value"] for f in funds)
    total_gain = total_value - total_invested
    abs_return = (total_gain / total_invested * 100) if total_invested > 0 else 0

    # Try to get summary from page 1 header (more accurate)
    hdr_invested = _find_header_amount(text, r'Investment\s+Amount')
    hdr_value = _find_header_amount(text, r'Current\s+Amount')
    hdr_gain = _find_header_amount(text, r'Gain/Loss')
    hdr_abs = _find_header_pct(text, r'Absolute\s+Return')
    hdr_xirr = _find_header_pct(text, r'XIRR')

    return {
        "investor": {
            **investor,
            "folio_count": 0,
            "report_date": _extract_report_date(text),
            "family_members": family,
        },
        "summary": {
            "total_invested": round(hdr_invested or total_invested, 2),
            "total_value": round(hdr_value or total_value, 2),
            "total_gain": round(hdr_gain or total_gain, 2),
            "abs_return": round(hdr_abs or abs_return, 2),
            "xirr": hdr_xirr or xirr,
        },
        "funds": funds,
    }


def _extract_valuation_investor(text: str) -> dict:
    """Extract investor info from a Valuation Report."""
    investor = {"name": "", "pan": None, "mobile": None, "email": None}

    # Name is typically the first prominent text on page 1
    # Format: "Ram Shah TRUSTNER" or "Valuation Report...\nRam Shah"
    name_match = re.search(
        r'Valuation\s+Report.*?\n(.+?)(?:\s+TRUSTNER|\s+\(PAN)',
        text, re.IGNORECASE
    )
    if name_match:
        investor["name"] = name_match.group(1).strip()
    else:
        # Fallback: first line before (PAN:
        name_match2 = re.search(r'^(.+?)\s*\(PAN:', text, re.MULTILINE)
        if name_match2:
            investor["name"] = name_match2.group(1).strip()

    # Clean up name — remove report headers
    if investor["name"]:
        investor["name"] = re.sub(r'Current Sensex.*', '', investor["name"]).strip()

    # PAN
    pan_match = re.search(r'\(PAN:\s*([A-Z]{5}[0-9]{4}[A-Z])\)', text)
    if not pan_match:
        pan_match = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', text)
    if pan_match:
        investor["pan"] = pan_match.group(1)

    # Email — investor's email (skip office emails)
    email_matches = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', text[:1500])
    for em in email_matches:
        if 'trustner' not in em.lower():
            investor["email"] = em
            break

    # Mobile
    mob_match = re.search(r'Mob\.\s*No\.\s*:\s*\+?(\d{10,12})', text)
    if not mob_match:
        mob_match = re.search(r'\b([6-9]\d{9})\b', text[:1500])
    if mob_match:
        investor["mobile"] = mob_match.group(1)[-10:]  # last 10 digits

    if not investor["name"]:
        investor["name"] = "Unknown Investor"

    return investor


def _extract_family_members(text: str) -> list:
    """Extract family member summaries from page 1."""
    members = []
    # Pattern: "1 BADRI MISTRI [2208031] 9,46,561.11 22,641.6170 9,44,159.11 ..."
    pattern = r'(\d+)\s+([A-Z][A-Za-z\s.]+?)\s+\[\d+\]\s+([\d,]+\.\d+)\s+[\d,.]+\s+([\d,]+\.\d+)\s+[\d.]+\s+[\d.]+\s+([\-\d,]+\.\d+)\s+([\-\d.,]+%)\s+([\-\d.,]+%)'
    for m in re.finditer(pattern, text[:3000]):
        try:
            members.append({
                "name": m.group(2).strip(),
                "invested": _parse_number(m.group(3)),
                "value": _parse_number(m.group(4)),
                "gain": _parse_number(m.group(5)),
                "abs_return": m.group(6),
                "xirr": m.group(7),
            })
        except (ValueError, IndexError):
            continue
    return members


def _extract_valuation_funds(text: str) -> list:
    """Extract scheme-wise fund data from Valuation Report summary tables."""
    funds = []

    # Find the "Scheme Wise Family Investment Summary" or "Scheme Name Inv. Amt. ..." table
    # This is a tabular format: "Scheme Name  Inv. Amt.  Cur. Value  Dividend  Gain/Loss  Abs. Rtn.  XIRR"
    # Each line: "Canara Robeco Small Cap Fund Growth 3,34,914.98 4,53,846.72 0.00 1,18,931.74 35.51% 12.00%"

    lines = text.split('\n')
    in_scheme_table = False
    seen_funds = set()

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Detect start of scheme table
        if re.search(r'Scheme\s+Name\s+Inv\.?\s*Amt', line, re.IGNORECASE):
            in_scheme_table = True
            continue

        # Detect end of scheme table (e.g., "Total", "Fund House Wise", "Page no")
        if in_scheme_table and re.search(
            r'^(Total|Fund\s+House|Fund\s+Type|Page\s+no|Client\s+Name|Sr\.\s*No\.)',
            line, re.IGNORECASE
        ):
            in_scheme_table = False
            continue

        if not in_scheme_table:
            continue

        # Parse scheme line
        # Pattern: "Fund Name Growth  1,23,456.78  1,34,567.89  0.00  11,111.11  9.00%  12.00%"
        # The fund name ends where the first number starts
        match = re.match(
            r'^(.+?)\s+'                           # Fund name (non-greedy)
            r'([\d,]+\.\d{2})\s+'                  # Invested amount
            r'([\d,]+\.\d{2})\s+'                  # Current value
            r'([\d,]+\.\d{2})\s+'                  # Dividend
            r'([\-]?[\d,]+\.\d{2})\s+'             # Gain/Loss
            r'([\-]?[\d.,]+%)\s+'                   # Abs Return
            r'([\-]?[\d.,]+%)',                      # XIRR
            line
        )
        if match:
            fund_name = match.group(1).strip()
            # Skip header rows or junk
            if fund_name.lower() in ('scheme name', '') or len(fund_name) < 5:
                continue

            invested = _parse_number(match.group(2))
            value = _parse_number(match.group(3))
            gain = _parse_number(match.group(5))

            # Parse percentages
            abs_str = match.group(6).replace(',', '').replace('%', '')
            xirr_str = match.group(7).replace(',', '').replace('%', '')
            try:
                abs_return = float(abs_str)
            except ValueError:
                abs_return = None
            try:
                xirr = float(xirr_str)
            except ValueError:
                xirr = None

            # Deduplicate
            if fund_name in seen_funds:
                continue
            seen_funds.add(fund_name)

            fund = {
                "name": fund_name,
                "amc": _infer_amc(fund_name),
                "category": _infer_category(fund_name),
                "plan": "Direct" if re.search(r'\bDirect\b', fund_name, re.IGNORECASE) else "Regular",
                "folio": None,
                "units": None,
                "nav": None,
                "invested": round(invested, 2),
                "value": round(value, 2),
                "abs_return": abs_return,
                "xirr": xirr,
                "action": None,
                "since": None,
                "analysis": None,
                "lock_in": bool(re.search(r'ELSS|Tax Sav', fund_name, re.IGNORECASE)),
                "lock_in_until": None,
            }
            funds.append(fund)

    return funds


def _find_header_amount(text: str, label_pattern: str) -> Optional[float]:
    """Extract a specific amount from page 1 header summary."""
    # Look for pattern followed by a number on the same or next line
    pat = label_pattern + r'[\s\n]+([\d,]+\.\d{2})'
    match = re.search(pat, text[:2000], re.IGNORECASE)
    if match:
        try:
            return _parse_number(match.group(1))
        except ValueError:
            pass
    return None


def _find_header_pct(text: str, label_pattern: str) -> Optional[float]:
    """Extract a percentage from page 1 header summary."""
    pat = label_pattern + r'[\s\n]+([\-\d.,]+)%'
    match = re.search(pat, text[:2000], re.IGNORECASE)
    if match:
        try:
            return float(match.group(1).replace(',', ''))
        except ValueError:
            pass
    return None


# ===========================================================================
# TEXT EXTRACTION (shared)
# ===========================================================================

def _extract_text(pdf_path: str, password: Optional[str] = None) -> str:
    """Extract text from PDF, limiting to MAX_PAGES to prevent OOM."""
    # Try pdfplumber first (better text extraction)
    try:
        with pdfplumber.open(pdf_path, password=password) as pdf:
            pages = []
            for i, page in enumerate(pdf.pages):
                if i >= MAX_PAGES:
                    break
                text = page.extract_text()
                if text:
                    pages.append(text)
            if pages:
                return "\n".join(pages)
    except Exception:
        pass

    # Fallback: try pypdf with password
    try:
        reader = PdfReader(pdf_path)
        if reader.is_encrypted:
            if password:
                reader.decrypt(password)
            else:
                raise ValueError("PDF is password-protected. Please provide your PAN as password.")
        pages = []
        for i, page in enumerate(reader.pages):
            if i >= MAX_PAGES:
                break
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages)
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to read PDF: {str(e)}")


# ===========================================================================
# STANDARD CAS PARSER (CAMS / KFintech / MF Central)
# ===========================================================================

def _extract_investor(text: str) -> dict:
    """Extract investor name, PAN, email, mobile from CAS text."""
    investor = {"name": "", "pan": None, "mobile": None, "email": None}

    # Extract PAN (format: ABCDE1234F)
    pan_match = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', text)
    if pan_match:
        investor["pan"] = pan_match.group(1)

    # Extract email
    email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    if email_match:
        investor["email"] = email_match.group(0)

    # Extract mobile (Indian 10-digit)
    mobile_match = re.search(r'\b([6-9]\d{9})\b', text)
    if mobile_match:
        investor["mobile"] = mobile_match.group(1)

    # Extract name
    name_patterns = [
        r'(?:Name|Investor Name|Account Holder)\s*[:\-]?\s*([A-Z][A-Z\s.]+)',
        r'Dear\s+([A-Z][A-Za-z\s.]+)',
        r'^([A-Z][A-Z\s]{5,40})$',
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text, re.MULTILINE)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'\s+', ' ', name).strip()
            if len(name) > 2 and name != investor.get("pan", ""):
                investor["name"] = name
                break

    if not investor["name"]:
        investor["name"] = "Unknown Investor"

    return investor


def _extract_report_date(text: str) -> Optional[str]:
    """Extract the statement/report date."""
    date_patterns = [
        # Valuation Report format: "as on Date - 08 Mar, 2026"
        r'as\s+on\s+Date\s*[\-:]\s*(\d{1,2}\s+\w{3},?\s+\d{4})',
        r'(?:Statement|Report|As on|Date)\s*[:\-]?\s*(\d{1,2}[\-/]\w{3}[\-/]\d{4})',
        r'(?:Statement|Report|As on|Date)\s*[:\-]?\s*(\d{1,2}[\-/]\d{1,2}[\-/]\d{4})',
        r'(\d{1,2}-[A-Z][a-z]{2}-\d{4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def _extract_funds(text: str) -> list:
    """Extract fund-level data from CAS text."""
    funds = []

    folio_blocks = re.split(r'(?=Folio No[:\s])', text, flags=re.IGNORECASE)

    for block in folio_blocks:
        if len(block.strip()) < 20:
            continue

        fund = _parse_fund_block(block)
        if fund and fund.get("name") and fund.get("value", 0) > 0:
            funds.append(fund)

    # If folio-based parsing didn't work, try table-based extraction
    if not funds:
        funds = _extract_funds_tabular(text)

    return funds


def _parse_fund_block(block: str) -> Optional[dict]:
    """Parse a single fund block from CAS text."""
    fund = {
        "name": "",
        "amc": None,
        "category": None,
        "plan": "Regular",
        "folio": None,
        "units": None,
        "nav": None,
        "invested": 0,
        "value": 0,
        "abs_return": None,
        "xirr": None,
        "action": None,
        "since": None,
        "analysis": None,
        "lock_in": False,
        "lock_in_until": None,
    }

    folio_match = re.search(r'Folio No[:\s]*(\S+)', block, re.IGNORECASE)
    if folio_match:
        fund["folio"] = folio_match.group(1).strip().rstrip('/')

    name_patterns = [
        r'(?:Folio No[:\s]*\S+\s*[\n/]+)\s*(.+?)(?:\n|$)',
        r'([\w\s&]+(?:Fund|Scheme|Plan|Growth|Dividend|IDCW)[\w\s\-()]*)',
    ]
    for pattern in name_patterns:
        match = re.search(pattern, block, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'\s+', ' ', name)
            if len(name) > 5:
                fund["name"] = name
                break

    if re.search(r'\bDirect\b', fund["name"], re.IGNORECASE):
        fund["plan"] = "Direct"

    fund["category"] = _infer_category(fund["name"])
    fund["amc"] = _infer_amc(fund["name"])

    units_match = re.search(r'(?:Units|Closing Units?|Balance Units?)[:\s]*([0-9,]+\.?\d*)', block, re.IGNORECASE)
    if units_match:
        fund["units"] = _parse_number(units_match.group(1))

    nav_match = re.search(r'(?:NAV|Net Asset Value)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)', block, re.IGNORECASE)
    if nav_match:
        fund["nav"] = _parse_number(nav_match.group(1))

    value_patterns = [
        r'(?:Market Value|Current Value|Valuation)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
        r'(?:Value|Mkt Val)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
    ]
    for pattern in value_patterns:
        match = re.search(pattern, block, re.IGNORECASE)
        if match:
            fund["value"] = _parse_number(match.group(1))
            break

    cost_patterns = [
        r'(?:Cost Value|Total Cost|Amount Invested|Invested)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
        r'(?:Cost|Purchase)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
    ]
    for pattern in cost_patterns:
        match = re.search(pattern, block, re.IGNORECASE)
        if match:
            fund["invested"] = _parse_number(match.group(1))
            break

    if fund["units"] and fund["nav"] and not fund["value"]:
        fund["value"] = round(fund["units"] * fund["nav"], 2)

    if fund["invested"] > 0 and fund["value"] > 0:
        fund["abs_return"] = round((fund["value"] - fund["invested"]) / fund["invested"] * 100, 2)

    if re.search(r'\bELSS\b|Tax\s*Sav', fund["name"], re.IGNORECASE):
        fund["lock_in"] = True

    return fund


def _extract_funds_tabular(text: str) -> list:
    """Fallback: extract funds from tabular CAS format."""
    funds = []
    lines = text.split('\n')

    current_fund_name = None
    for line in lines:
        line = line.strip()
        if not line:
            continue

        if re.search(r'(Fund|Growth|IDCW|Dividend|Regular|Direct)', line, re.IGNORECASE):
            if not re.search(r'^\d', line) and len(line) > 10:
                current_fund_name = line

        numbers = re.findall(r'([0-9,]+\.?\d*)', line)
        if current_fund_name and len(numbers) >= 3:
            try:
                vals = [_parse_number(n) for n in numbers[-3:]]
                if vals[2] > 100:
                    funds.append({
                        "name": current_fund_name,
                        "amc": _infer_amc(current_fund_name),
                        "category": _infer_category(current_fund_name),
                        "plan": "Direct" if "Direct" in current_fund_name else "Regular",
                        "folio": None,
                        "units": vals[0],
                        "nav": vals[1],
                        "invested": 0,
                        "value": vals[2],
                        "abs_return": None,
                        "xirr": None,
                        "action": None,
                        "since": None,
                        "analysis": None,
                        "lock_in": bool(re.search(r'ELSS|Tax Sav', current_fund_name, re.IGNORECASE)),
                        "lock_in_until": None,
                    })
                    current_fund_name = None
            except (ValueError, IndexError):
                continue

    return funds


# ===========================================================================
# SHARED UTILITIES
# ===========================================================================

def _parse_number(s: str) -> float:
    """Parse a number string, removing commas."""
    return float(s.replace(',', ''))


def _infer_category(fund_name: str) -> Optional[str]:
    """Infer fund category from its name."""
    name = fund_name.lower()
    categories = {
        "small cap": ["small cap", "smallcap"],
        "mid cap": ["mid cap", "midcap", "mid-cap"],
        "large cap": ["large cap", "largecap", "large-cap", "bluechip", "blue chip"],
        "large & mid cap": ["large & mid", "large and mid"],
        "flexi cap": ["flexi cap", "flexicap"],
        "multi cap": ["multi cap", "multicap"],
        "elss": ["elss", "tax sav", "tax saving"],
        "balanced advantage": ["balanced advantage", "dynamic asset", "baf"],
        "aggressive hybrid": ["equity & debt", "equity hybrid", "aggressive hybrid"],
        "conservative hybrid": ["conservative hybrid", "debt hybrid"],
        "equity savings": ["equity savings"],
        "focused": ["focused"],
        "value": ["value", "contra"],
        "sectoral": ["sectoral", "thematic", "banking", "pharma", "technology", "infra",
                      "consumption", "manufacturing", "innovation", "digital"],
        "index": ["index", "nifty", "sensex", "etf"],
        "debt": ["liquid", "overnight", "money market", "short duration", "medium duration",
                 "long duration", "gilt", "corporate bond", "credit risk", "dynamic bond",
                 "floating rate"],
        "fof": ["fund of fund", "fof", "multi asset"],
        "gold": ["gold", "silver"],
        "retirement": ["retirement"],
        "defence": ["defence", "defense"],
        "commodities": ["commodit"],
    }
    for cat, keywords in categories.items():
        for kw in keywords:
            if kw in name:
                return cat.title()
    return None


def _infer_amc(fund_name: str) -> Optional[str]:
    """Infer AMC from fund name."""
    amcs = {
        "HDFC": ["HDFC"],
        "ICICI Pru": ["ICICI", "Prudential"],
        "SBI": ["SBI"],
        "Nippon India": ["Nippon", "Reliance"],
        "Kotak": ["Kotak"],
        "Axis": ["Axis"],
        "Mirae Asset": ["Mirae"],
        "DSP": ["DSP"],
        "Aditya Birla Sun Life": ["Aditya Birla", "ABSL"],
        "Tata": ["Tata"],
        "UTI": ["UTI"],
        "Franklin India": ["Franklin"],
        "Motilal Oswal": ["Motilal"],
        "Parag Parikh": ["Parag Parikh", "PPFAS"],
        "Canara Robeco": ["Canara"],
        "HSBC": ["HSBC"],
        "Edelweiss": ["Edelweiss"],
        "Sundaram": ["Sundaram"],
        "WhiteOak": ["WhiteOak", "White Oak"],
        "Quant": ["Quant"],
        "Bandhan": ["Bandhan"],
        "JM Financial": ["JM "],
        "Bajaj Finserv": ["Bajaj"],
        "Mahindra Manulife": ["Mahindra"],
        "Invesco": ["Invesco"],
        "PGIM India": ["PGIM"],
    }
    for amc, keywords in amcs.items():
        for kw in keywords:
            if kw.lower() in fund_name.lower():
                return amc + " MF"
    return None
