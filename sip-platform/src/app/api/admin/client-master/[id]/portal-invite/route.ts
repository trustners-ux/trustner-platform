/**
 * POST /api/admin/client-master/[id]/portal-invite
 *
 * Generate a tokenized portal-invite for a client. Stores the token
 * in client_portal_invites; the magic link URL is returned so HR can
 * copy/share manually (Phase A) or so the future WhatsApp/email sender
 * can pick it up (Phase B).
 *
 * Body (optional):
 *   { send_whatsapp?: boolean, send_email?: boolean, expires_in_days?: number }
 *
 * Auth: canWriteClients (editor+)
 */

import * as crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import { canWriteClients } from '@/lib/client-master/permissions';
import { getClient } from '@/lib/client-master/clients';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { sendWhatsAppText, formatWhatsAppPhone } from '@/lib/messaging/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InviteBody {
  send_whatsapp?: boolean;
  send_email?: boolean;
  expires_in_days?: number;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { id: idStr } = await context.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const client = await getClient(id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  let body: InviteBody = {};
  try { body = (await req.json()) as InviteBody; } catch { /* empty body OK */ }

  const expiresDays = Math.min(Math.max(body.expires_in_days ?? 14, 1), 60);
  const expires_at = new Date(Date.now() + expiresDays * 86400_000).toISOString();
  const token = crypto.randomBytes(32).toString('base64url');

  // Persist
  const { data, error } = await sb
    .from('client_portal_invites')
    .insert({
      client_id: client.id,
      token,
      status: 'pending',
      sent_via_whatsapp: !!body.send_whatsapp,
      sent_via_email: !!body.send_email,
      sent_to_mobile: body.send_whatsapp ? client.mobile_primary : null,
      sent_to_email: body.send_email ? client.email_primary : null,
      expires_at,
      created_by_user_id: a.actor.user_id,
      notes: `Generated via admin UI by ${a.actor.email}`,
    })
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: `Insert failed: ${error?.message || 'unknown'}` }, { status: 500 });
  }

  // Build the magic-link URL — Phase B will host /portal/claim/[token]
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.merasip.com';
  const magicLink = `${baseUrl}/portal/claim/${token}`;

  // Phase B: actually dispatch over WhatsApp + email when requested.
  const dispatch_results: { channel: 'whatsapp' | 'email'; ok: boolean; error?: string }[] = [];
  const inviteText =
    `Hello ${client.first_name},\n\n` +
    `Trustner has set up your client portal. Use the link below to claim your account ` +
    `and explore your profile, family, and KYC status.\n\n` +
    `${magicLink}\n\n` +
    `This link is single-use and expires in ${expiresDays} days.\n\n` +
    `— Trustner Asset Services (ARN-286886)`;

  if (body.send_whatsapp && client.mobile_primary) {
    try {
      const wa = await sendWhatsAppText(formatWhatsAppPhone(client.mobile_primary), inviteText);
      dispatch_results.push({ channel: 'whatsapp', ok: wa });
    } catch (err) {
      dispatch_results.push({
        channel: 'whatsapp',
        ok: false,
        error: err instanceof Error ? err.message : 'send failed',
      });
    }
  }

  if (body.send_email && client.email_primary) {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Trustner <noreply@merasip.com>';
      if (!apiKey) {
        dispatch_results.push({ channel: 'email', ok: false, error: 'RESEND_API_KEY not configured' });
      } else {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [client.email_primary],
            subject: 'Welcome to your Trustner client portal',
            html: `
              <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                <h2 style="color:#0A1628;font-size:20px;margin:0 0 12px">Welcome, ${client.first_name}!</h2>
                <p style="font-size:13px;color:#475569;margin:0 0 16px;line-height:1.5">
                  Trustner has set up your client portal. Tap the button below to claim your account
                  and explore your profile, family, and KYC status.
                </p>
                <p style="margin:24px 0">
                  <a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#1E40AF,#06B6D4);color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">
                    Claim my account
                  </a>
                </p>
                <p style="font-size:11px;color:#94A3B8;margin:0 0 16px;line-height:1.5">
                  This link is single-use and expires in ${expiresDays} days. If the button doesn&apos;t work, copy and paste this URL:<br>
                  <code style="font-size:10px;word-break:break-all">${magicLink}</code>
                </p>
                <p style="font-size:11px;color:#94A3B8;margin:18px 0 0;line-height:1.5">
                  Trustner Asset Services Pvt Ltd · ARN-286886 · AMFI registered Mutual Fund Distributor.
                </p>
              </div>
            `,
          }),
        });
        if (!r.ok) {
          const t = await r.text().catch(() => '');
          dispatch_results.push({ channel: 'email', ok: false, error: `HTTP ${r.status}: ${t.slice(0, 200)}` });
        } else {
          dispatch_results.push({ channel: 'email', ok: true });
        }
      }
    } catch (err) {
      dispatch_results.push({
        channel: 'email',
        ok: false,
        error: err instanceof Error ? err.message : 'send failed',
      });
    }
  }

  // Mark sent if at least one channel succeeded
  const anySent = dispatch_results.some((d) => d.ok);
  const sentAt = anySent ? new Date().toISOString() : null;
  await sb
    .from('client_portal_invites')
    .update({
      status: anySent ? 'sent' : 'pending',
      sent_at: sentAt,
    })
    .eq('id', (data as { id: number }).id);

  return NextResponse.json({
    ok: true,
    invite: {
      id: (data as { id: number }).id,
      client_id: client.id,
      client_name: client.display_name,
      mobile: client.mobile_primary,
      email: client.email_primary,
      token,
      magic_link: magicLink,
      expires_at,
      will_send_whatsapp: !!body.send_whatsapp,
      will_send_email: !!body.send_email,
      send_dispatched: anySent,
      dispatch_results,
      phase_a_note: anySent
        ? `Invite dispatched. The client will receive a magic link to claim their portal.`
        : `Magic link generated. Copy & share manually below.`,
    },
  });
}
