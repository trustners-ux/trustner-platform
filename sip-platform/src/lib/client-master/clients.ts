/**
 * Client CRUD — core async operations on the client master via Supabase.
 *
 * Code generator: codes are allocated by Postgres via the
 *   `generate_client_code()` / `generate_family_code()` functions defined in
 *   migration 027. We rely on the DEFAULT clause so callers don't pass `code`.
 *
 * Aadhaar safety: callers pass the full 12 digits to `digestAadhaar()`,
 *   which extracts last-4 + computes sha256. The full Aadhaar is NEVER
 *   persisted.
 *
 * Consent log: every change to *_opt_in flags appends a tagged entry
 *   to consent_log JSONB so the audit trail is regulator-provable.
 */

import * as crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type {
  ClientRow,
  ClientStatus,
  ClientGender,
  MaritalStatus,
  ResidentialStatus,
  RiskProfile,
  OnboardedVia,
  KycStatus,
  ConsentEntry,
  ClientsActor,
} from './types';

// ─── Aadhaar helpers ─────────────────────────────────────────────────────────

export function digestAadhaar(full12: string): { last4: string; hash: string } {
  const cleaned = full12.replace(/\D/g, '');
  if (cleaned.length !== 12) throw new Error('Aadhaar must be exactly 12 digits');
  return {
    last4: cleaned.slice(-4),
    hash: crypto.createHash('sha256').update(cleaned).digest('hex'),
  };
}

/** Display helper: masks Aadhaar for non-KYC viewers. */
export function maskAadhaar(last4: string | null): string {
  if (!last4) return '—';
  return `XXXX-XXXX-${last4}`;
}

/** Display helper: masks PAN — show first 5 (entity code) + last digit. */
export function maskPan(pan: string | null): string {
  if (!pan) return '—';
  if (pan.length !== 10) return pan;
  return `${pan.slice(0, 5)}XXXX${pan.slice(-1)}`;
}

// ─── Field validators ────────────────────────────────────────────────────────

function validatePan(pan: string | null | undefined): string | null {
  if (!pan) return null;
  const s = pan.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(s)) {
    throw new Error(`PAN "${pan}" does not match format ABCDE1234F`);
  }
  return s;
}

function validateMobile(m: string | null | undefined): string | null {
  if (!m) return null;
  let s = m.replace(/[\s\-()]/g, '');
  if (!s) return null;

  // Strip "00" international prefix (some clients export with "00" instead of "+")
  if (/^00\d+$/.test(s)) s = s.slice(2);

  // Strip leading "0" Indian STD trunk prefix — "09863080661" → "9863080661"
  if (/^0[6-9]\d{9}$/.test(s)) s = s.slice(1);

  // Indian 10-digit mobile (6-9 prefix)
  if (/^(\+91)?[6-9][0-9]{9}$/.test(s)) {
    return s.startsWith('+91') ? s : ('+91' + s.replace(/^91/, ''));
  }

  // Pre-prefixed international (+ followed by 7–15 digits, must start non-zero)
  if (/^\+[1-9][0-9]{6,14}$/.test(s)) return s;

  // Pure-digit foreign number (10–15 digits, no + prefix) — treat as international
  if (/^[1-9][0-9]{9,14}$/.test(s)) return '+' + s;

  // Indian landline 10-digit (starts 2/3/4/5) — accept verbatim
  if (/^[2-5][0-9]{9}$/.test(s)) return s;

  // Placeholder values (all-zero, etc.) — drop silently rather than throw
  if (/^0+$/.test(s)) return null;

  throw new Error(`Mobile "${m}" doesn't look valid.`);
}

function validateEmail(e: string | null | undefined): string | null {
  if (!e) return null;
  const s = e.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    throw new Error(`Email "${e}" doesn't look valid`);
  }
  return s;
}

function computeAge(dob: string | null): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}/.test(dob)) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() ||
      (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 && age < 130 ? age : null;
}

// ─── Consent helpers ─────────────────────────────────────────────────────────

function appendConsent(existing: ConsentEntry[] | null, entry: ConsentEntry): ConsentEntry[] {
  const arr: ConsentEntry[] = Array.isArray(existing) ? existing.slice() : [];
  arr.push(entry);
  if (arr.length > 100) return arr.slice(-100);
  return arr;
}

// ─── Create input ────────────────────────────────────────────────────────────

export interface CreateClientInput {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  salutation?: string | null;
  gender?: ClientGender;
  dob?: string | null;
  marital_status?: MaritalStatus;

  pan?: string | null;
  aadhaar_full12?: string | null;

  mobile_primary?: string | null;
  mobile_alt?: string | null;
  email_primary?: string | null;
  email_alt?: string | null;

  addr_current_line1?: string | null;
  addr_current_line2?: string | null;
  addr_current_city?: string | null;
  addr_current_state?: string | null;
  addr_current_pincode?: string | null;
  addr_current_country?: string;

  addr_permanent_same_as_current?: boolean;
  addr_permanent_line1?: string | null;
  addr_permanent_line2?: string | null;
  addr_permanent_city?: string | null;
  addr_permanent_state?: string | null;
  addr_permanent_pincode?: string | null;
  addr_permanent_country?: string | null;

  residential_status?: ResidentialStatus;
  occupation?: string | null;
  employer?: string | null;
  annual_income_band?: string | null;
  risk_profile?: RiskProfile;

  onboarded_via?: OnboardedVia;
  onboarded_by_user_id?: number | null;
  onboarded_by_partner_id?: number | null;

  whatsapp_opt_in?: boolean;
  sms_opt_in?: boolean;
  email_opt_in?: boolean;
  marketing_opt_in?: boolean;
  consent_source?: string;

  preferred_language?: string;
  tags?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;

  actor: ClientsActor;
}

/** Error subclass with `existing` context, thrown on PAN / Aadhaar dedup. */
export class DuplicateClientError extends Error {
  existing: { id: number; code: string; display_name: string };
  constructor(message: string, existing: { id: number; code: string; display_name: string }) {
    super(message);
    this.name = 'DuplicateClientError';
    this.existing = existing;
  }
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createClient(input: CreateClientInput): Promise<ClientRow> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');

  const first_name = (input.first_name || '').trim();
  const last_name = (input.last_name || '').trim();
  if (!first_name || !last_name) throw new Error('first_name and last_name required');

  const middle_name = input.middle_name?.trim() || null;
  const display_name = `${input.salutation ? input.salutation + ' ' : ''}${first_name}${middle_name ? ' ' + middle_name : ''} ${last_name}`.trim();

  const pan = validatePan(input.pan);
  let aadhaar_last4: string | null = null;
  let aadhaar_hash: string | null = null;
  if (input.aadhaar_full12) {
    const d = digestAadhaar(input.aadhaar_full12);
    aadhaar_last4 = d.last4;
    aadhaar_hash = d.hash;
  }
  const mobile_primary = validateMobile(input.mobile_primary);
  const mobile_alt = validateMobile(input.mobile_alt);
  const email_primary = validateEmail(input.email_primary);
  const email_alt = validateEmail(input.email_alt);

  // Dedup checks — soft-error so the API can offer "open existing client"
  if (pan) {
    const { data: dup } = await supabase
      .from('clients')
      .select('id, code, display_name')
      .eq('pan', pan)
      .limit(1)
      .maybeSingle();
    if (dup) {
      throw new DuplicateClientError(
        `A client with PAN ${pan} already exists: ${dup.display_name} (${dup.code})`,
        dup,
      );
    }
  }
  if (aadhaar_hash) {
    const { data: dup } = await supabase
      .from('clients')
      .select('id, code, display_name')
      .eq('aadhaar_hash', aadhaar_hash)
      .limit(1)
      .maybeSingle();
    if (dup) {
      throw new DuplicateClientError(
        `A client with the same Aadhaar already exists: ${dup.display_name} (${dup.code})`,
        dup,
      );
    }
  }

  const dob = input.dob && /^\d{4}-\d{2}-\d{2}/.test(input.dob) ? input.dob.slice(0, 10) : null;
  const age = computeAge(dob);

  // Seed consent_log with whichever opt-ins are TRUE at create time
  let consent_log: ConsentEntry[] | null = null;
  const consentSource = input.consent_source || `created via ${input.onboarded_via || 'rm'}`;
  for (const ch of ['whatsapp', 'sms', 'email', 'marketing'] as const) {
    const optKey = `${ch}_opt_in` as const;
    if (input[optKey]) {
      consent_log = appendConsent(consent_log, {
        channel: ch,
        opted_in: true,
        at: new Date().toISOString(),
        source: consentSource,
        by_user_id: input.actor.user_id,
      });
    }
  }

  const insertRow = {
    // `code` deliberately omitted — Postgres DEFAULT generate_client_code() fills it
    first_name,
    middle_name,
    last_name,
    display_name,
    salutation: input.salutation || null,
    gender: input.gender || 'U',
    dob,
    age_years: age,
    marital_status: input.marital_status || 'unknown',
    pan,
    pan_status: pan ? 'unverified' : null,
    aadhaar_last4,
    aadhaar_hash,
    aadhaar_status: aadhaar_last4 ? 'unverified' : null,
    mobile_primary,
    mobile_alt,
    email_primary,
    email_alt,
    addr_current_line1: input.addr_current_line1 || null,
    addr_current_line2: input.addr_current_line2 || null,
    addr_current_city: input.addr_current_city || null,
    addr_current_state: input.addr_current_state || null,
    addr_current_pincode: input.addr_current_pincode || null,
    addr_current_country: input.addr_current_country || 'India',
    addr_permanent_same_as_current: input.addr_permanent_same_as_current !== false,
    addr_permanent_line1: input.addr_permanent_line1 || null,
    addr_permanent_line2: input.addr_permanent_line2 || null,
    addr_permanent_city: input.addr_permanent_city || null,
    addr_permanent_state: input.addr_permanent_state || null,
    addr_permanent_pincode: input.addr_permanent_pincode || null,
    addr_permanent_country: input.addr_permanent_country || null,
    residential_status: input.residential_status || 'resident',
    occupation: input.occupation || null,
    employer: input.employer || null,
    annual_income_band: input.annual_income_band || null,
    risk_profile: input.risk_profile || 'unknown',
    onboarded_via: input.onboarded_via || 'rm',
    onboarded_by_user_id: input.onboarded_by_user_id ?? null,
    onboarded_by_partner_id: input.onboarded_by_partner_id ?? null,
    whatsapp_opt_in: !!input.whatsapp_opt_in,
    sms_opt_in: !!input.sms_opt_in,
    email_opt_in: !!input.email_opt_in,
    marketing_opt_in: !!input.marketing_opt_in,
    consent_log,
    preferred_language: input.preferred_language || 'en',
    tags: input.tags || null,
    notes: input.notes || null,
    metadata: input.metadata ?? null,
    created_by_user_id: input.actor.user_id,
  };

  const { data, error } = await supabase
    .from('clients')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`Create client failed: ${error?.message || 'no row returned'}`);
  return data as ClientRow;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getClient(id: number): Promise<ClientRow | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as ClientRow | null) ?? null;
}

export async function getClientByCode(code: string): Promise<ClientRow | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  return (data as ClientRow | null) ?? null;
}

export interface ListClientsOptions {
  q?: string;
  status?: ClientStatus | ClientStatus[];
  kyc_status?: KycStatus | KycStatus[];
  onboarded_by_user_id?: number;
  onboarded_by_partner_id?: number;
  limit?: number;
  offset?: number;
}

export async function listClients(opts: ListClientsOptions = {}): Promise<{ rows: ClientRow[]; total: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');

  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 500);
  const offset = Math.max(opts.offset ?? 0, 0);

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('display_name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (opts.q) {
    const wild = `%${opts.q}%`;
    // Postgres ilike across multiple columns via .or()
    query = query.or([
      `display_name.ilike.${wild}`,
      `mobile_primary.ilike.${wild}`,
      `mobile_alt.ilike.${wild}`,
      `email_primary.ilike.${wild}`,
      `pan.ilike.${wild}`,
      `code.ilike.${wild}`,
    ].join(','));
  }
  if (opts.status) {
    const arr = Array.isArray(opts.status) ? opts.status : [opts.status];
    query = query.in('status', arr);
  }
  if (opts.kyc_status) {
    const arr = Array.isArray(opts.kyc_status) ? opts.kyc_status : [opts.kyc_status];
    query = query.in('kyc_status', arr);
  }
  if (opts.onboarded_by_user_id) {
    query = query.eq('onboarded_by_user_id', opts.onboarded_by_user_id);
  }
  if (opts.onboarded_by_partner_id) {
    query = query.eq('onboarded_by_partner_id', opts.onboarded_by_partner_id);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(`List clients failed: ${error.message}`);

  return {
    rows: (data as ClientRow[]) || [],
    total: count ?? 0,
  };
}

// ─── Update ──────────────────────────────────────────────────────────────────

export type UpdateClientPatch = Partial<{
  first_name: string;
  middle_name: string | null;
  last_name: string;
  salutation: string | null;
  gender: ClientGender;
  dob: string | null;
  marital_status: MaritalStatus;
  pan: string | null;
  aadhaar_full12: string | null;
  mobile_primary: string | null;
  mobile_alt: string | null;
  email_primary: string | null;
  email_alt: string | null;
  addr_current_line1: string | null;
  addr_current_line2: string | null;
  addr_current_city: string | null;
  addr_current_state: string | null;
  addr_current_pincode: string | null;
  addr_current_country: string;
  addr_permanent_same_as_current: boolean;
  addr_permanent_line1: string | null;
  addr_permanent_line2: string | null;
  addr_permanent_city: string | null;
  addr_permanent_state: string | null;
  addr_permanent_pincode: string | null;
  addr_permanent_country: string | null;
  residential_status: ResidentialStatus;
  occupation: string | null;
  employer: string | null;
  annual_income_band: string | null;
  risk_profile: RiskProfile;
  whatsapp_opt_in: boolean;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  marketing_opt_in: boolean;
  consent_source: string;
  preferred_language: string;
  tags: string | null;
  notes: string | null;
  status: ClientStatus;
  metadata: Record<string, unknown> | null;
}>;

const SIMPLE_UPDATE_FIELDS = [
  'first_name', 'middle_name', 'last_name', 'salutation',
  'gender', 'dob', 'marital_status',
  'addr_current_line1', 'addr_current_line2', 'addr_current_city',
  'addr_current_state', 'addr_current_pincode', 'addr_current_country',
  'addr_permanent_line1', 'addr_permanent_line2', 'addr_permanent_city',
  'addr_permanent_state', 'addr_permanent_pincode', 'addr_permanent_country',
  'residential_status', 'occupation', 'employer', 'annual_income_band', 'risk_profile',
  'preferred_language', 'tags', 'notes', 'status',
] as const;

export async function updateClient(
  id: number,
  patch: UpdateClientPatch,
  actor: ClientsActor,
): Promise<ClientRow> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');

  const existing = await getClient(id);
  if (!existing) throw new Error('Client not found');

  const update: Record<string, unknown> = {};

  for (const f of SIMPLE_UPDATE_FIELDS) {
    if (f in patch) {
      update[f] = (patch as Record<string, unknown>)[f] ?? null;
    }
  }

  // Validate contact fields
  if ('mobile_primary' in patch) update.mobile_primary = validateMobile(patch.mobile_primary);
  if ('mobile_alt' in patch)     update.mobile_alt = validateMobile(patch.mobile_alt);
  if ('email_primary' in patch)  update.email_primary = validateEmail(patch.email_primary);
  if ('email_alt' in patch)      update.email_alt = validateEmail(patch.email_alt);

  // Recompute display_name if any name part changed
  if ('first_name' in patch || 'middle_name' in patch || 'last_name' in patch || 'salutation' in patch) {
    const first = (patch.first_name ?? existing.first_name).trim();
    const middle = 'middle_name' in patch ? (patch.middle_name?.trim() ?? null) : existing.middle_name;
    const last = (patch.last_name ?? existing.last_name).trim();
    const sal = 'salutation' in patch ? patch.salutation : existing.salutation;
    update.display_name = `${sal ? sal + ' ' : ''}${first}${middle ? ' ' + middle : ''} ${last}`.trim();
  }

  // DOB → recompute age
  if ('dob' in patch) {
    update.age_years = computeAge(patch.dob ?? null);
  }

  // Permanent same-as-current toggle
  if ('addr_permanent_same_as_current' in patch) {
    update.addr_permanent_same_as_current = !!patch.addr_permanent_same_as_current;
  }

  // PAN (with dedup)
  if ('pan' in patch) {
    const newPan = validatePan(patch.pan);
    if (newPan && newPan !== existing.pan) {
      const { data: dup } = await supabase
        .from('clients').select('id').eq('pan', newPan).neq('id', id).limit(1).maybeSingle();
      if (dup) throw new Error(`PAN ${newPan} already in use by client #${(dup as { id: number }).id}`);
    }
    update.pan = newPan;
    update.pan_status = newPan ? (newPan === existing.pan ? existing.pan_status : 'unverified') : null;
  }

  // Aadhaar (with dedup; never persist full 12)
  if ('aadhaar_full12' in patch) {
    if (patch.aadhaar_full12) {
      const d = digestAadhaar(patch.aadhaar_full12);
      if (d.hash !== existing.aadhaar_hash) {
        const { data: dup } = await supabase
          .from('clients').select('id').eq('aadhaar_hash', d.hash).neq('id', id).limit(1).maybeSingle();
        if (dup) throw new Error(`Aadhaar already in use by client #${(dup as { id: number }).id}`);
      }
      update.aadhaar_last4 = d.last4;
      update.aadhaar_hash = d.hash;
      update.aadhaar_status = 'unverified';
    } else {
      update.aadhaar_last4 = null;
      update.aadhaar_hash = null;
      update.aadhaar_status = null;
    }
  }

  // Consent updates — append to log
  const consentChanges: { channel: 'whatsapp' | 'sms' | 'email' | 'marketing'; opted_in: boolean }[] = [];
  for (const ch of ['whatsapp', 'sms', 'email', 'marketing'] as const) {
    const k = `${ch}_opt_in` as const;
    if (k in patch) {
      const newVal = !!patch[k];
      const oldVal = !!(existing as unknown as Record<string, boolean>)[k];
      if (newVal !== oldVal) consentChanges.push({ channel: ch, opted_in: newVal });
      update[k] = newVal;
    }
  }
  if (consentChanges.length > 0) {
    let log: ConsentEntry[] | null = existing.consent_log;
    for (const c of consentChanges) {
      log = appendConsent(log, {
        ...c,
        at: new Date().toISOString(),
        source: patch.consent_source || `updated by ${actor.email}`,
        by_user_id: actor.user_id,
      });
    }
    update.consent_log = log;
  }

  // Metadata
  if ('metadata' in patch) {
    update.metadata = patch.metadata ?? null;
  }

  if (Object.keys(update).length === 0) return existing;

  const { data, error } = await supabase
    .from('clients')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) throw new Error(`Update failed: ${error?.message || 'no row returned'}`);
  return data as ClientRow;
}

// ─── Quick dedup helpers ─────────────────────────────────────────────────────

export async function findByMobile(mobile: string): Promise<ClientRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');
  const v = mobile.replace(/\D/g, '').slice(-10);
  if (!v || v.length < 10) return [];
  const wild = `%${v}`;
  const { data } = await supabase
    .from('clients')
    .select('*')
    .or(`mobile_primary.ilike.${wild},mobile_alt.ilike.${wild}`)
    .limit(5);
  return (data as ClientRow[]) || [];
}

export async function findByEmail(email: string): Promise<ClientRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');
  const v = email.trim().toLowerCase();
  const { data } = await supabase
    .from('clients')
    .select('*')
    .or(`email_primary.eq.${v},email_alt.eq.${v}`)
    .limit(5);
  return (data as ClientRow[]) || [];
}
