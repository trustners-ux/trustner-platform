/**
 * CASParser.in API client
 *
 * Wraps the CDSL OTP fetch flow and Smart Parse endpoint.
 * All calls require CASPARSER_API_KEY env var.
 *
 * @see https://casparser.in/docs
 */

const BASE = 'https://api.casparser.in';

function apiKey(): string {
  const key = process.env.CASPARSER_API_KEY;
  if (!key) throw new Error('CASPARSER_API_KEY env var is missing');
  return key;
}

function headers(): Record<string, string> {
  return {
    'x-api-key': apiKey(),
    'Content-Type': 'application/json',
  };
}

// ─── Types ───

export interface CdslFetchResponse {
  session_id: string;
}

export interface CdslVerifyResponse {
  files: { filename: string; url: string }[];
}

export interface CasParserInvestor {
  name: string | null;
  pan: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
}

export interface CasParserTransaction {
  date: string;
  description: string;
  type: string;
  amount: number | null;
  units: number;
  nav: number | null;
  balance: number;
}

export interface CasParserScheme {
  isin: string | null;
  name: string;
  type: string;
  units: number;
  nav: number;
  value: number;
  cost: number;
  gain: { absolute: number; percentage: number };
  additional_info: {
    advisor?: string;
    rta_code?: string;
    amfi?: string;
    open_units?: number;
    close_units?: number;
  };
  transactions: CasParserTransaction[];
}

export interface CasParserFolio {
  folio_number: string;
  amc: string;
  registrar: string;
  value: number;
  linked_holders: { name: string; pan: string }[];
  schemes: CasParserScheme[];
}

export interface CasParserMeta {
  cas_type: string;
  statement_period: string;
  generated_at: string;
}

export interface SmartParseResponse {
  meta: CasParserMeta;
  investor: CasParserInvestor;
  summary: {
    total_value: number;
    accounts: Record<string, { count: number; total_value: number }>;
  };
  mutual_funds: CasParserFolio[];
}

// ─── API calls ───

/**
 * Step 1: Initiate CDSL CAS fetch — sends OTP to investor's registered mobile.
 * Returns a session_id for the verify step.
 */
export async function cdslFetch(pan: string, dob: string): Promise<CdslFetchResponse> {
  const res = await fetch(`${BASE}/v4/cdsl/fetch`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ pan: pan.toUpperCase(), dob }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new CasParserError(`CDSL fetch failed (${res.status})`, res.status, body);
  }

  return res.json();
}

/**
 * Step 2: Verify OTP and get CAS PDF download URLs.
 */
export async function cdslVerify(
  sessionId: string,
  otp: string,
  numPeriods = 1
): Promise<CdslVerifyResponse> {
  const res = await fetch(`${BASE}/v4/cdsl/fetch/${sessionId}/verify`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ otp, num_periods: numPeriods }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new CasParserError(`OTP verification failed (${res.status})`, res.status, body);
  }

  return res.json();
}

/**
 * Parse a CAS PDF from a URL (returned by CDSL verify).
 */
export async function smartParseUrl(pdfUrl: string, password?: string): Promise<SmartParseResponse> {
  const res = await fetch(`${BASE}/v4/smart/parse`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ pdf_url: pdfUrl, ...(password ? { password } : {}) }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new CasParserError(`Smart Parse failed (${res.status})`, res.status, body);
  }

  return res.json();
}

/**
 * Parse an uploaded CAS PDF buffer.
 */
export async function smartParseFile(pdfBuffer: Buffer, password?: string): Promise<SmartParseResponse> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), 'cas.pdf');
  if (password) form.append('password', password);

  const res = await fetch(`${BASE}/v4/smart/parse`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey() },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new CasParserError(`Smart Parse failed (${res.status})`, res.status, body);
  }

  return res.json();
}

export class CasParserError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string
  ) {
    super(message);
    this.name = 'CasParserError';
  }
}
