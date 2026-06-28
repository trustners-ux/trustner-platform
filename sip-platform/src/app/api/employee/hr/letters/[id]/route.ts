/**
 * GET    /api/employee/hr/letters/<id>   — fetch one archived letter (+ CSS) for the detail view.
 * DELETE /api/employee/hr/letters/<id>   — remove a letter from the archive (regenerable from the employee record).
 * Both gated by can_access_letters.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { LETTER_CSS, getLetterTemplate } from '@/lib/hr/letter-templates';

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
    .select('id, employee_id, letter_type, entity, recipient_name, serial_number, status, generated_html, data_snapshot, generated_by, generated_at')
    .eq('id', Number(id))
    .eq('is_deleted', false)
    .single();
  if (error || !row) return NextResponse.json({ error: 'Letter not found' }, { status: 404 });

  // Re-render from the snapshot for older rows that didn't persist HTML.
  let html = row.generated_html as string | null;
  if (!html) {
    const tpl = getLetterTemplate(row.letter_type);
    html = tpl ? tpl.render((row.data_snapshot as Record<string, unknown>) ?? {}) : '';
  }
  return NextResponse.json({ letter: { ...row, generated_html: html }, css: LETTER_CSS });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { id } = await ctx.params;
  // Soft-delete — preserve the audit trail (letters are regenerable anyway).
  const { error } = await supabase
    .from('hr_letter_archive')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: actor.email })
    .eq('id', Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
