/**
 * PUBLIC endpoint — candidate uses their tokenized link before they have a login.
 *
 * GET    /api/onboarding/<token>          — fetch their onboarding record + uploaded docs
 * PATCH  /api/onboarding/<token>          — update fields (related-party declarations etc.) + mark submitted
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { encryptPii, decryptPii } from '@/lib/security/pii-crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function loadRecord(token: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured', status: 503 as const };
  const { data, error } = await supabase
    .from('hr_onboarding')
    .select(`
      id, token, entity, candidate_name, email, phone, designation, department, status,
      date_of_joining, office_code, expires_at, changes_requested_note,
      father_spouse_name, dob, gender, blood_group, marital_status, whatsapp, reporting_manager,
      pan, aadhaar,
      curr_address_line1, curr_address_line2, curr_city, curr_state, curr_pin,
      perm_same, perm_address_line1, perm_address_line2, perm_city, perm_state, perm_pin,
      bank_name, bank_branch, account_number, ifsc, account_type,
      education, is_fresher, employment, emergency_contacts,
      related_party_yn, related_party_details, other_intermediary_yn, other_intermediary_details,
      nda_agreed_at, declaration_agreed_at, coi_agreed_at
    `)
    .eq('token', token)
    .single();
  if (error || !data) return { error: 'Token not found or invalid', status: 404 as const };
  if (new Date(data.expires_at) < new Date()) {
    return { error: 'This invite link has expired. Please contact HR for a new link.', status: 410 as const };
  }
  if (data.status === 'approved' || data.status === 'rejected') {
    return { error: `This onboarding is already ${data.status}. Contact HR if anything needs to change.`, status: 409 as const };
  }
  return { record: data };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const r = await loadRecord(token);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });

  const supabase = getSupabaseAdmin();
  const { data: docs } = await supabase!
    .from('hr_onboarding_documents')
    .select('id, category, filename, uploaded_at, status, notes')
    .eq('onboarding_id', r.record!.id)
    .order('uploaded_at', { ascending: false });

  const record = { ...r.record! };
  record.aadhaar = decryptPii(record.aadhaar) ?? record.aadhaar;
  record.account_number = decryptPii(record.account_number) ?? record.account_number;
  return NextResponse.json({ onboarding: record, documents: docs ?? [] });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const r = await loadRecord(token);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json();
  // Fields the candidate may set on their own tokenised record. (candidate_name,
  // entity, designation, DOJ etc. are HR-controlled at invite time and excluded.)
  const allowed = [
    // Personal
    'father_spouse_name', 'dob', 'gender', 'blood_group', 'marital_status', 'whatsapp', 'reporting_manager',
    // KYC
    'pan', 'aadhaar',
    // Current address
    'curr_address_line1', 'curr_address_line2', 'curr_city', 'curr_state', 'curr_pin',
    // Permanent address
    'perm_same', 'perm_address_line1', 'perm_address_line2', 'perm_city', 'perm_state', 'perm_pin',
    // Bank
    'bank_name', 'bank_branch', 'account_number', 'ifsc', 'account_type',
    // History (JSONB arrays) + fresher flag
    'education', 'is_fresher', 'employment', 'emergency_contacts',
    // Compliance declarations (existing)
    'related_party_yn', 'related_party_details', 'other_intermediary_yn', 'other_intermediary_details',
    // Workflow
    'status',
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }
  // Encrypt PII before storage
  if (typeof patch.aadhaar === 'string') patch.aadhaar = encryptPii(patch.aadhaar);
  if (typeof patch.account_number === 'string') patch.account_number = encryptPii(patch.account_number);
  // Normalise PAN to uppercase (HR still reviews; we don't hard-reject partial saves)
  if (typeof patch.pan === 'string') patch.pan = patch.pan.trim().toUpperCase();
  // Consents arrive as booleans; persist an audit timestamp when ticked, clear when un-ticked.
  const nowIso = new Date().toISOString();
  if ('nda_agreed' in body) patch.nda_agreed_at = body.nda_agreed ? nowIso : null;
  if ('declaration_agreed' in body) patch.declaration_agreed_at = body.declaration_agreed ? nowIso : null;
  if ('coi_agreed' in body) patch.coi_agreed_at = body.coi_agreed ? nowIso : null;
  // Candidate may only set status to 'in_progress' or 'submitted'
  if (patch.status && !['in_progress', 'submitted'].includes(String(patch.status))) {
    delete patch.status;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from('hr_onboarding')
    .update(patch)
    .eq('token', token)
    .select('*')
    .single();
  if (error) {
    console.error('[Onboarding]', error.message);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
  return NextResponse.json({ onboarding: data });
}
