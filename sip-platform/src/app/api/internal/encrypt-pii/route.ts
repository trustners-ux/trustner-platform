/**
 * ONE-TIME migration route: encrypt plaintext Aadhaar + bank account numbers
 * in hr_onboarding rows. Delete this route after running.
 *
 * POST /api/internal/encrypt-pii
 * Header: Authorization: Bearer <MIGRATION_SECRET>
 *
 * Prerequisites:
 *   - PII_ENCRYPTION_KEY set in Vercel (64-char hex)
 *   - MIGRATION_SECRET set in Vercel (any strong random string)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { encryptPii, isEncrypted } from '@/lib/security/pii-crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  const secret = process.env.MIGRATION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'MIGRATION_SECRET not set' }, { status: 503 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.PII_ENCRYPTION_KEY) {
    return NextResponse.json({ error: 'PII_ENCRYPTION_KEY not set' }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  }

  const { data: rows, error } = await supabase
    .from('hr_onboarding')
    .select('id, aadhaar, account_number')
    .not('aadhaar', 'is', null);

  if (error) {
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  let encrypted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows ?? []) {
    const updates: Record<string, string | null> = {};

    if (row.aadhaar && !isEncrypted(row.aadhaar)) {
      updates.aadhaar = encryptPii(row.aadhaar);
    }
    if (row.account_number && !isEncrypted(row.account_number)) {
      updates.account_number = encryptPii(row.account_number);
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('hr_onboarding')
      .update(updates)
      .eq('id', row.id);

    if (upErr) {
      errors.push(`Row ${row.id}: ${upErr.message}`);
    } else {
      encrypted++;
    }
  }

  return NextResponse.json({
    total: (rows ?? []).length,
    encrypted,
    skipped,
    errors: errors.length ? errors : undefined,
  });
}
