/**
 * GET /api/employee/hr/letters/<id>/doc
 *   Streams an archived letter as a Word-openable .doc (styled HTML). Word and
 *   Google Docs honour the embedded letter CSS, so HR gets the on-screen styling
 *   in a fully editable file to tweak and send. Gated by can_access_letters.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { getLetterTemplate, LETTER_CSS } from '@/lib/hr/letter-templates';
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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { id } = await ctx.params;
  const { data: row, error } = await supabase
    .from('hr_letter_archive')
    .select('id, letter_type, entity, recipient_name, serial_number, generated_html, data_snapshot')
    .eq('id', Number(id))
    .single();
  if (error || !row) return NextResponse.json({ error: 'Letter not found' }, { status: 404 });

  // Prefer the stored HTML; re-render from the snapshot if it's an older row.
  let html = row.generated_html as string | null;
  if (!html) {
    const tpl = getLetterTemplate(row.letter_type);
    if (!tpl) return NextResponse.json({ error: `Unknown template: ${row.letter_type}` }, { status: 404 });
    html = tpl.render((row.data_snapshot as Record<string, unknown>) ?? {});
  }

  const tpl = getLetterTemplate(row.letter_type);
  const title = `${row.recipient_name || 'Letter'} — ${tpl?.name || row.letter_type}`;
  const doc = buildWordDoc(html, LETTER_CSS, title);
  const fname = safeFileName(`${row.recipient_name || 'letter'}_${row.letter_type}`) + '.doc';

  return new NextResponse(doc, {
    headers: {
      'Content-Type': 'application/msword; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fname}"`,
      'Cache-Control': 'no-store',
    },
  });
}
