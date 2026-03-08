"""CAS PDF Parser — extracts portfolio data from CAMS/KFintech/MFCentral PDFs."""

import re
from typing import Optional

import pdfplumber
from pypdf import PdfReader


def parse_cas(pdf_path: str, password: Optional[str] = None) -> dict:
    """
    Parse a CAS (Consolidated Account Statement) PDF and return structured portfolio data.

    Supports:
    - CAMS CAS
    - KFintech CAS
    - MF Central CAS

    Args:
        pdf_path: Path to the PDF file
        password: Optional password (usually investor PAN for protected PDFs)

    Returns:
        dict matching IndividualPortfolioSchema
    """
    full_text = _extract_text(pdf_path, password)
    if not full_text or len(full_text.strip()) < 100:
        raise ValueError("Could not extract text from PDF. File may be image-based or corrupted.")

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
            "xirr": None,  # XIRR requires full transaction history
        },
        "funds": funds,
    }


def _extract_text(pdf_path: str, password: Optional[str] = None) -> str:
    """Extract text from PDF, handling password-protected files."""
    # Try pdfplumber first (better text extraction)
    try:
        with pdfplumber.open(pdf_path, password=password) as pdf:
            pages = []
            for page in pdf.pages:
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
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages)
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to read PDF: {str(e)}")


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

    # Extract name — typically near the top of the document
    # CAMS format: name appears after "Name:" or near PAN
    name_patterns = [
        r'(?:Name|Investor Name|Account Holder)\s*[:\-]?\s*([A-Z][A-Z\s.]+)',
        r'Dear\s+([A-Z][A-Za-z\s.]+)',
        # Fallback: first line that looks like a name (all caps, 2+ words)
        r'^([A-Z][A-Z\s]{5,40})$',
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text, re.MULTILINE)
        if match:
            name = match.group(1).strip()
            # Clean up — remove trailing spaces, multiple spaces
            name = re.sub(r'\s+', ' ', name).strip()
            if len(name) > 2 and name != investor.get("pan", ""):
                investor["name"] = name
                break

    if not investor["name"]:
        investor["name"] = "Unknown Investor"

    return investor


def _extract_report_date(text: str) -> Optional[str]:
    """Extract the CAS statement date."""
    date_patterns = [
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

    # Split text into fund blocks
    # CAMS/KFintech format: blocks separated by "Folio No:" or scheme name lines
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

    # Extract folio number
    folio_match = re.search(r'Folio No[:\s]*(\S+)', block, re.IGNORECASE)
    if folio_match:
        fund["folio"] = folio_match.group(1).strip().rstrip('/')

    # Extract scheme/fund name
    # Usually the first meaningful line after Folio No, or a line containing "Fund" or "Scheme"
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

    # Determine plan type
    if re.search(r'\bDirect\b', fund["name"], re.IGNORECASE):
        fund["plan"] = "Direct"
    else:
        fund["plan"] = "Regular"

    # Extract category from fund name
    fund["category"] = _infer_category(fund["name"])

    # Extract AMC
    fund["amc"] = _infer_amc(fund["name"])

    # Extract numeric values
    # Units
    units_match = re.search(r'(?:Units|Closing Units?|Balance Units?)[:\s]*([0-9,]+\.?\d*)', block, re.IGNORECASE)
    if units_match:
        fund["units"] = _parse_number(units_match.group(1))

    # NAV
    nav_match = re.search(r'(?:NAV|Net Asset Value)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)', block, re.IGNORECASE)
    if nav_match:
        fund["nav"] = _parse_number(nav_match.group(1))

    # Market Value / Current Value
    value_patterns = [
        r'(?:Market Value|Current Value|Valuation)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
        r'(?:Value|Mkt Val)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
    ]
    for pattern in value_patterns:
        match = re.search(pattern, block, re.IGNORECASE)
        if match:
            fund["value"] = _parse_number(match.group(1))
            break

    # Cost Value / Invested
    cost_patterns = [
        r'(?:Cost Value|Total Cost|Amount Invested|Invested)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
        r'(?:Cost|Purchase)[:\s]*(?:Rs\.?\s*)?([0-9,]+\.?\d*)',
    ]
    for pattern in cost_patterns:
        match = re.search(pattern, block, re.IGNORECASE)
        if match:
            fund["invested"] = _parse_number(match.group(1))
            break

    # If we have units and NAV but no value, calculate it
    if fund["units"] and fund["nav"] and not fund["value"]:
        fund["value"] = round(fund["units"] * fund["nav"], 2)

    # Calculate absolute return
    if fund["invested"] > 0 and fund["value"] > 0:
        fund["abs_return"] = round((fund["value"] - fund["invested"]) / fund["invested"] * 100, 2)

    # Check for ELSS / lock-in
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

        # Look for lines that contain fund names (typically have "Fund" or AMC names)
        if re.search(r'(Fund|Growth|IDCW|Dividend|Regular|Direct)', line, re.IGNORECASE):
            if not re.search(r'^\d', line) and len(line) > 10:
                current_fund_name = line

        # Look for lines with numeric data (units, NAV, value)
        numbers = re.findall(r'([0-9,]+\.?\d*)', line)
        if current_fund_name and len(numbers) >= 3:
            try:
                # Heuristic: last 3 numbers are usually units, NAV, value
                vals = [_parse_number(n) for n in numbers[-3:]]
                if vals[2] > 100:  # Minimum value threshold
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
    }
    for amc, keywords in amcs.items():
        for kw in keywords:
            if kw.lower() in fund_name.lower():
                return amc + " MF"
    return None
