/**
 * Policy OTP-signing API.
 *
 * POST /api/employee/hr/policies/:id/sign?action=send_otp
 *   Generates a 6-digit OTP, persists in hr_policy_otp_sessions, sends to
 *   employee's WhatsApp (and falls back to email if no phone).
 *
 * POST /api/employee/hr/policies/:id/sign?action=verify
 *   Body: { otp: string, tnc_agreed: true, user_agent: string }
 *   Verifies the OTP + records an immutable audit row in
 *   hr_policy_acknowledgements.
 *
 * GET  /api/employee/hr/policies/:id/sign
 *   Returns the actor's acknowledgement status for this policy.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomInt, createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { sendOtpViaWhatsApp } from '@/lib/messaging/whatsapp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const OTP_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

function getActorIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || null;
}

async function resolveEmployee(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return { error: 'Unauthenticated', status: 401 as const };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured', status: 503 as const };
  const { data: emp } = await supabase
    .from('hr_employees')
    .select('id, full_name, email, phone, entity')
    .eq('email', actor.email.toLowerCase())
    .maybeSingle();
  if (!emp) {
    return { error: 'No employee record for your email. HR must create your record first.', status: 400 as const };
  }
  return { actor, emp, supabase };
}

// ── GET — status check ────────────────────────────────────────────
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const r = await resolveEmployee(req);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { id } = await ctx.params;

  const { data: policy } = await r.supabase
    .from('hr_policies')
    .select('id, title, version, requires_acknowledgement, blob_url')
    .eq('id', id)
    .single();
  if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });

  const { data: ack } = await r.supabase
    .from('hr_policy_acknowledgements')
    .select('*')
    .eq('policy_id', id)
    .eq('employee_id', r.emp.id)
    .eq('policy_version', policy.version)
    .maybeSingle();

  return NextResponse.json({
    policy,
    employee: { id: r.emp.id, name: r.emp.full_name, phone: r.emp.phone, email: r.emp.email },
    already_signed: !!ack,
    signed_at: ack?.acknowledged_at ?? null,
    signature_method: ack?.signature_method ?? null,
  });
}

// ── POST — send_otp / verify ──────────────────────────────────────
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const r = await resolveEmployee(req);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { id } = await ctx.params;

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'send_otp';

  const { data: policy } = await r.supabase
    .from('hr_policies')
    .select('id, title, version, requires_acknowledgement')
    .eq('id', id)
    .single();
  if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
  if (!policy.requires_acknowledgement) {
    return NextResponse.json({ error: 'This policy does not require acknowledgement.' }, { status: 400 });
  }

  // Already signed? Block re-sign for same version.
  const { data: existing } = await r.supabase
    .from('hr_policy_acknowledgements')
    .select('id')
    .eq('policy_id', id)
    .eq('employee_id', r.emp.id)
    .eq('policy_version', policy.version)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'You have already signed this version.' }, { status: 409 });
  }

  if (action === 'send_otp') {
    // Generate 6-digit OTP
    const otp = randomInt(100000, 1000000).toString();
    const expires_at = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000).toISOString();

    // Prefer WhatsApp if phone present; fallback to email
    let delivery_channel: 'whatsapp' | 'email' = 'whatsapp';
    let delivery_target = r.emp.phone || '';
    if (!delivery_target) {
      delivery_channel = 'email';
      delivery_target = r.emp.email;
    }

    // Persist session
    const { data: session, error: insErr } = await r.supabase
      .from('hr_policy_otp_sessions')
      .insert({
        policy_id: Number(id),
        employee_id: r.emp.id,
        otp_code: otp,
        delivery_channel,
        delivery_target,
        expires_at,
      })
      .select('id')
      .single();
    if (insErr) {
      console.error('[Policy sign: OTP insert]', insErr.message);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // Send the OTP
    if (delivery_channel === 'whatsapp') {
      await sendOtpViaWhatsApp(delivery_target, otp).catch(() => undefined);
    } else {
      // Email fallback via Resend — best effort
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Trustner HR <noreply@merasip.com>',
            to: delivery_target,
            subject: `Your OTP to sign "${policy.title}"`,
            html: `<p>Hi ${r.emp.full_name},</p>
                   <p>Your verification code to sign <b>${policy.title}</b> (v${policy.version}) is:</p>
                   <p style="font-size:24px;font-weight:bold;letter-spacing:6px">${otp}</p>
                   <p>This code is valid for ${OTP_TTL_MIN} minutes.</p>
                   <p>— Trustner Asset Services · ARN-286886</p>`,
          }),
        }).catch(() => undefined);
      }
    }

    return NextResponse.json({
      session_id: session.id,
      delivery_channel,
      // Mask the target for safety
      delivery_target_masked: delivery_channel === 'whatsapp'
        ? '+91 XXXXXX' + delivery_target.replace(/\D/g, '').slice(-4)
        : delivery_target.replace(/^(.{2}).+(@.+)$/, '$1***$2'),
      expires_in_seconds: OTP_TTL_MIN * 60,
    });
  }

  if (action === 'verify') {
    const body = await req.json();
    const { otp, tnc_agreed, user_agent } = body as { otp?: string; tnc_agreed?: boolean; user_agent?: string };
    if (!otp || !tnc_agreed) {
      return NextResponse.json({ error: 'otp and tnc_agreed=true required' }, { status: 400 });
    }

    // Look up most recent unconsumed session for this employee+policy
    const { data: session } = await r.supabase
      .from('hr_policy_otp_sessions')
      .select('*')
      .eq('employee_id', r.emp.id)
      .eq('policy_id', Number(id))
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!session) {
      return NextResponse.json({ error: 'OTP session not found or expired. Please request a new OTP.' }, { status: 410 });
    }
    if (session.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many failed attempts. Request a new OTP.' }, { status: 429 });
    }
    if (session.otp_code !== otp.trim()) {
      await r.supabase.from('hr_policy_otp_sessions').update({ attempts: session.attempts + 1 }).eq('id', session.id);
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 401 });
    }

    // Mark session consumed
    await r.supabase
      .from('hr_policy_otp_sessions')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', session.id);

    // Build audit hash (tamper-proof verification artifact)
    const ip = getActorIp(req);
    const now = new Date().toISOString();
    const hashSource = `${r.emp.id}|${policy.id}|${policy.version}|${session.id}|${now}|${ip || ''}|${user_agent || ''}`;
    const audit_hash = createHash('sha256').update(hashSource).digest('hex');

    // INSERT — table has UPDATE trigger blocking modification (audit-grade)
    const { data: ack, error: ackErr } = await r.supabase
      .from('hr_policy_acknowledgements')
      .insert({
        policy_id: policy.id,
        employee_id: r.emp.id,
        policy_version: policy.version,
        signature_method: session.delivery_channel === 'whatsapp' ? 'otp_whatsapp' : 'otp_email',
        otp_sent_at: session.created_at,
        otp_verified_at: now,
        otp_delivery_channel: session.delivery_channel,
        otp_delivery_target: session.delivery_target,
        tnc_agreed: true,
        tnc_agreed_at: now,
        acknowledged_at: now,
        acknowledged_ip: ip,
        acknowledged_user_agent: user_agent || null,
        audit_hash,
      })
      .select('*')
      .single();
    if (ackErr) {
      console.error('[Policy sign: ack insert]', ackErr.message);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ack, audit_hash });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
