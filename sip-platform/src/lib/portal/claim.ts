/**
 * Server-side helpers for the portal-claim flow.
 *
 *   - lookupInvite(token)  → validate the token, return linked client
 *   - claimInvite(...)     → mark invite claimed, create portal_user,
 *                           sign session token, link client.portal_user_id
 */

import * as bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  signClientPortalToken,
  type ClientPortalJWTPayload,
} from '@/lib/auth/client-portal-jwt';

export interface InviteLookup {
  ok: true;
  invite_id: number;
  client: {
    id: number;
    code: string;
    display_name: string;
    mobile_primary: string | null;
    email_primary: string | null;
  };
  expires_at: string;
}
export interface InviteLookupErr { ok: false; reason: string }

export async function lookupInvite(token: string): Promise<InviteLookup | InviteLookupErr> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, reason: 'Supabase not configured' };
  const { data, error } = await sb
    .from('client_portal_invites')
    .select('id, client_id, status, expires_at, claimed_at, revoked_at, clients!inner(id, code, display_name, mobile_primary, email_primary)')
    .eq('token', token)
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, reason: error.message };
  if (!data) return { ok: false, reason: 'Invalid invite link.' };

  type Row = {
    id: number;
    client_id: number;
    status: string;
    expires_at: string;
    claimed_at: string | null;
    revoked_at: string | null;
    clients: { id: number; code: string; display_name: string; mobile_primary: string | null; email_primary: string | null };
  };
  const row = data as unknown as Row;
  if (row.status === 'claimed' || row.claimed_at) return { ok: false, reason: 'This invite has already been claimed. Use Sign in instead.' };
  if (row.status === 'revoked' || row.revoked_at) return { ok: false, reason: 'This invite has been revoked.' };
  if (new Date(row.expires_at) < new Date()) return { ok: false, reason: 'This invite link has expired.' };

  return {
    ok: true,
    invite_id: row.id,
    client: row.clients,
    expires_at: row.expires_at,
  };
}

export interface ClaimInput {
  invite_id: number;
  client_id: number;
  client_code: string;
  display_name: string;
  /** Which identifier the client verified — at least one. */
  login_mobile: string | null; // E.164
  login_email: string | null;
  /** Optional 4-digit PIN for future transaction-time auth. */
  pin?: string;
  /** Optional long password. */
  password?: string;
}

export interface ClaimResult {
  ok: true;
  portal_user_id: number;
  session_token: string;
}
export interface ClaimErr { ok: false; reason: string }

export async function claimInvite(input: ClaimInput): Promise<ClaimResult | ClaimErr> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, reason: 'Supabase not configured' };
  if (!input.login_mobile && !input.login_email) {
    return { ok: false, reason: 'Need a mobile or email identifier' };
  }

  // Idempotency: a portal_user may already exist for this client (re-claim attempt)
  const { data: existing } = await sb
    .from('portal_users')
    .select('id')
    .eq('client_id', input.client_id)
    .maybeSingle();
  if (existing) {
    return { ok: false, reason: 'This client already has a portal account. Sign in instead.' };
  }

  const password_hash = input.password ? await bcrypt.hash(input.password, 10) : null;
  const pin_hash = input.pin ? await bcrypt.hash(input.pin, 10) : null;

  const { data: pu, error: puErr } = await sb
    .from('portal_users')
    .insert({
      client_id: input.client_id,
      login_mobile: input.login_mobile,
      login_email: input.login_email,
      password_hash,
      pin_hash,
      mobile_verified: !!input.login_mobile,
      email_verified: !!input.login_email,
      status: 'active',
      claimed_via_invite_id: input.invite_id,
      last_login_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (puErr || !pu) {
    return { ok: false, reason: puErr?.message || 'Portal user create failed' };
  }
  const portal_user_id = (pu as { id: number }).id;

  // Mark invite claimed
  await sb
    .from('client_portal_invites')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('id', input.invite_id);

  // Link the client → portal_user_id
  await sb.from('clients').update({ portal_user_id }).eq('id', input.client_id);

  const payload: ClientPortalJWTPayload = {
    portalUserId: portal_user_id,
    clientId: input.client_id,
    clientCode: input.client_code,
    displayName: input.display_name,
    loginMobile: input.login_mobile,
    loginEmail: input.login_email,
  };
  const session_token = await signClientPortalToken(payload);
  return { ok: true, portal_user_id, session_token };
}
