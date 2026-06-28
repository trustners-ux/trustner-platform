/**
 * POST /api/employee/hr/letters/render
 *
 * Server-renders the requested letter template against the submitted data
 * snapshot and returns the HTML. Does NOT persist — used for live preview
 * inside the form. To persist, call POST /api/employee/hr/letters.
 *
 * Body: { template_id: string, data: Record<string, unknown> }
 * Response: { html: string, css: string }
 */
import { NextResponse } from 'next/server';
import { getLetterTemplate, LETTER_CSS } from '@/lib/hr/letter-templates';
import { recomputeComp } from '@/lib/hr/letter-fields';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { template_id, data } = body as { template_id?: string; data?: Record<string, unknown> };
    if (!template_id || !data) {
      return NextResponse.json({ error: 'template_id and data are required' }, { status: 400 });
    }
    const tpl = getLetterTemplate(template_id);
    if (!tpl) {
      return NextResponse.json({ error: `Unknown template_id: ${template_id}` }, { status: 404 });
    }
    // Auto-recompute compensation totals from monthly inputs.
    const enriched = recomputeComp(data);
    const html = tpl.render(enriched);
    return NextResponse.json({ html, css: LETTER_CSS });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
