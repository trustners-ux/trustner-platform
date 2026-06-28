/**
 * Policy Documents API — Employee Handbook + all 92 HR DOCX templates.
 *
 * GET    /api/employee/hr/policies              — list (any authenticated employee)
 * POST   /api/employee/hr/policies              — upload (admin only)
 * DELETE /api/employee/hr/policies?id=N         — soft delete = archive (admin)
 * POST   /api/employee/hr/policies/ack          — record an acknowledgement
 */
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB (handbook can be big)
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const category = url.searchParams.get('category');

  let query = supabase
    .from('hr_policies')
    .select('id, category, title, description, doc_code, version, effective_date, blob_url, filename, size_bytes, entities, requires_acknowledgement, status, uploaded_by, created_at')
    .eq('status', 'active')
    .order('category')
    .order('doc_code');

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ policies: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_compliance) {
    return NextResponse.json({ error: 'Need can_access_compliance permission' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const title = String(form.get('title') || '').trim();
  const category = String(form.get('category') || '').trim();
  const version = String(form.get('version') || '1.0').trim();
  const doc_code = String(form.get('doc_code') || '').trim() || null;
  const description = String(form.get('description') || '').trim() || null;
  const effective_date = String(form.get('effective_date') || '').trim() || null;
  const requires_acknowledgement = form.get('requires_acknowledgement') === 'true';
  const entitiesRaw = String(form.get('entities') || 'TAS,TIB').trim();
  const entities = entitiesRaw.split(',').map((s) => s.trim()).filter(Boolean);

  if (!file || !(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 });
  if (!title || !category) return NextResponse.json({ error: 'title and category required' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: `File exceeds ${MAX_SIZE / 1024 / 1024} MB` }, { status: 413 });
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: `Unsupported MIME: ${file.type} (PDF or DOCX only)` }, { status: 415 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const key = `hr-policies/${category}/${doc_code || 'misc'}-v${version}-${Date.now()}-${safeName}`;
  const blob = await put(key, file, { access: 'public', addRandomSuffix: true });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from('hr_policies')
    .insert({
      category, title, description, doc_code, version,
      effective_date,
      blob_url: blob.url, filename: file.name, size_bytes: file.size, mime_type: file.type,
      entities, requires_acknowledgement,
      uploaded_by: actor.email,
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ policy: data });
}

export async function DELETE(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_compliance) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('hr_policies').update({ status: 'archived' }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
