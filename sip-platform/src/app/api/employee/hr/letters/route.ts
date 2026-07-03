/**
 * GET /api/employee/hr/letters
 *   List letters from hr_letter_archive (paginated).
 *
 * POST /api/employee/hr/letters
 *   Persist a generated letter snapshot to hr_letter_archive.
 *   Body: {
 *     template_id: string,
 *     entity: 'TAS'|'TIB',
 *     recipient_name: string,
 *     data: Record<string,unknown>,
 *     status?: 'draft'|'sent',
 *     serial_number?: string,
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getLetterTemplate, LETTER_CSS } from '@/lib/hr/letter-templates';
import { recomputeComp } from '@/lib/hr/letter-fields';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getEmployee(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

export async function GET(req: NextRequest) {
  const emp = await getEmployee(req);
  if (!emp) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, parseInt(url.searchParams.get('pageSize') || '25', 10));

  const { data, error, count } = await supabase
    .from('hr_letter_archive')
    .select(
      'id, letter_type, entity, recipient_name, serial_number, status, generated_by, generated_at',
      { count: 'exact' }
    )
    .eq('is_deleted', false)
    .order('generated_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee(req);
  if (!emp) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const {
    template_id,
    entity,
    recipient_name,
    data,
    status = 'draft',
    serial_number,
  } = body as {
    template_id?: string;
    entity?: 'TAS' | 'TIB';
    recipient_name?: string;
    data?: Record<string, unknown>;
    status?: 'draft' | 'sent';
    serial_number?: string;
  };

  if (!template_id || !entity || !data) {
    return NextResponse.json({ error: 'template_id, entity, and data are required' }, { status: 400 });
  }
  const tpl = getLetterTemplate(template_id);
  if (!tpl) {
    return NextResponse.json({ error: `Unknown template: ${template_id}` }, { status: 404 });
  }
  const enriched = recomputeComp(data);
  const generated_html = tpl.render(enriched);

  const insertRow = {
    letter_type: template_id,
    entity,
    recipient_name: recipient_name || (enriched.candidate_name as string) || '',
    data_snapshot: enriched,
    generated_html,
    generated_by: emp.email,
    serial_number,
    status,
  };

  const { data: inserted, error } = await supabase
    .from('hr_letter_archive')
    .insert(insertRow)
    .select('id, letter_type, entity, recipient_name, serial_number, status, generated_by, generated_at')
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json({ row: inserted, css: LETTER_CSS });
}
