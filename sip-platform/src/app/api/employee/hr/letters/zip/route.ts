/**
 * GET /api/employee/hr/letters/zip?employee_id=123   (or ?ids=1,2,3)
 *   Bundles the matching archived letters into a single .zip of Word .doc files
 *   so HR can grab a joiner's whole letter pack in one click. Gated by can_access_letters.
 */
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { LETTER_CSS, getLetterTemplate } from '@/lib/hr/letter-templates';
import { buildWordDoc, safeFileName } from '@/lib/hr/letter-prefill';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function actorOk(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_letters ? actor : null;
}

export async function GET(req: NextRequest) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employee_id');
  const idsParam = url.searchParams.get('ids');

  let query = supabase
    .from('hr_letter_archive')
    .select('id, letter_type, recipient_name, generated_html, data_snapshot')
    .eq('is_deleted', false)
    .order('generated_at', { ascending: true });
  if (idsParam) {
    const ids = idsParam.split(',').map((n) => Number(n)).filter(Boolean);
    if (!ids.length) return NextResponse.json({ error: 'No valid ids' }, { status: 400 });
    query = query.in('id', ids);
  } else if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  } else {
    return NextResponse.json({ error: 'employee_id or ids required' }, { status: 400 });
  }

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ error: 'No letters found' }, { status: 404 });

  const zip = new JSZip();
  const recipient = rows[0].recipient_name || 'employee';
  for (const row of rows) {
    let html = row.generated_html as string | null;
    if (!html) {
      const tpl = getLetterTemplate(row.letter_type);
      html = tpl ? tpl.render((row.data_snapshot as Record<string, unknown>) ?? {}) : '';
    }
    const tpl = getLetterTemplate(row.letter_type);
    const doc = buildWordDoc(html || '', LETTER_CSS, `${recipient} — ${tpl?.name || row.letter_type}`);
    zip.file(`${safeFileName(`${recipient}_${row.letter_type}`)}.doc`, doc);
  }

  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  const zipName = safeFileName(`${recipient}_letter_pack`) + '.zip';
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
