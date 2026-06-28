/**
 * POST /api/employee/hr/attendance/punch
 *
 * Body: { action: 'in' | 'out', lat?, lng?, is_wfh?: boolean }
 *
 * On 'in' — creates today's row if not already present, sets punch_in,
 *           validates geofence against employee's office (skipped if WFH).
 * On 'out' — updates today's row with punch_out + computes total_hours + status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { haversineMeters, computeStatus } from '@/lib/hr/attendance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_punch_attendance) {
    return NextResponse.json({ error: 'Not permitted to punch attendance' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { action, lat, lng, is_wfh, biometric_method, biometric_device_id, photo_url } = body as {
    action?: 'in' | 'out'; lat?: number; lng?: number; is_wfh?: boolean;
    biometric_method?: 'face' | 'fingerprint' | 'none';
    biometric_device_id?: string;
    photo_url?: string;
  };
  if (action !== 'in' && action !== 'out') {
    return NextResponse.json({ error: 'action must be "in" or "out"' }, { status: 400 });
  }

  // Resolve employee record + their attendance_mode
  const { data: emp } = await supabase
    .from('hr_employees')
    .select('id, office_code, attendance_mode')
    .eq('email', actor.email.toLowerCase())
    .maybeSingle();
  if (!emp) return NextResponse.json({ error: 'No employee record. HR must onboard you first.' }, { status: 400 });

  // Enforce attendance-mode rules (Handbook §10 + the verified-attendance regime)
  const mode = emp.attendance_mode || 'office';
  if (mode === 'office' && !is_wfh) {
    // Office employees must use biometric/facial at the office device.
    // Web-only punches from an office employee are blocked unless they
    // explicitly mark WFH (which requires HR pre-approval, not yet wired —
    // for now WFH = honor system, logged + flagged).
    if (!biometric_method || biometric_method === 'none') {
      return NextResponse.json({
        error: 'Office staff must use the biometric / facial-recognition device at the office entry. Web punch is not permitted from office premises.',
      }, { status: 400 });
    }
  }
  if (mode === 'field' && !is_wfh) {
    // Field employees must provide geo + a real-time selfie. No exceptions.
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({
        error: 'Field staff must enable location to punch attendance.',
      }, { status: 400 });
    }
    if (!photo_url) {
      return NextResponse.json({
        error: 'Field staff must capture a real-time selfie to punch attendance.',
      }, { status: 400 });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // Geofence check (skip for WFH)
  let location: string | null = null;
  let geofenceWarning: string | null = null;
  if (!is_wfh) {
    if (typeof lat === 'number' && typeof lng === 'number' && emp.office_code) {
      const { data: office } = await supabase
        .from('hr_offices')
        .select('lat, lng, geofence_radius_m, city')
        .eq('code', emp.office_code)
        .maybeSingle();
      if (office?.lat && office?.lng) {
        const dist = haversineMeters(lat, lng, Number(office.lat), Number(office.lng));
        if (dist > (office.geofence_radius_m || 200)) {
          geofenceWarning = `Punch location is ${Math.round(dist)}m from ${office.city} office (radius ${office.geofence_radius_m}m). Marked but flagged.`;
        }
        location = office.city;
      }
    }
  } else {
    location = 'WFH';
  }

  // Get existing row for today (if any)
  const { data: existing } = await supabase
    .from('hr_attendance_logs')
    .select('*')
    .eq('employee_id', emp.id)
    .eq('log_date', today)
    .maybeSingle();

  if (action === 'in') {
    if (existing?.punch_in) {
      return NextResponse.json({ error: 'Already punched in today.' }, { status: 409 });
    }
    // Check DSR submission for field/sales staff
    const { data: dsrToday } = await supabase
      .from('hr_dsr_entries').select('id').eq('employee_id', emp.id).eq('entry_date', today).maybeSingle();
    const row = {
      employee_id: emp.id,
      log_date: today,
      punch_in: now.toISOString(),
      punch_in_lat: lat ?? null,
      punch_in_lng: lng ?? null,
      punch_in_location: location,
      attendance_mode: mode,
      biometric_method: biometric_method ?? null,
      biometric_device_id: biometric_device_id ?? null,
      punch_in_photo_url: photo_url ?? null,
      geofence_compliant: !geofenceWarning,
      dsr_submitted: !!dsrToday,
      notes: geofenceWarning,
    };
    const { data, error } = await supabase
      .from('hr_attendance_logs')
      .upsert(row, { onConflict: 'employee_id,log_date' })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ log: data, geofenceWarning });
  }

  // action === 'out'
  if (!existing?.punch_in) {
    return NextResponse.json({ error: 'Cannot punch out without punching in.' }, { status: 409 });
  }
  if (existing.punch_out) {
    return NextResponse.json({ error: 'Already punched out today.' }, { status: 409 });
  }

  const verdict = computeStatus({
    punch_in: new Date(existing.punch_in),
    punch_out: now,
    is_wfh: !!is_wfh,
  });
  const { data, error } = await supabase
    .from('hr_attendance_logs')
    .update({
      punch_out: now.toISOString(),
      punch_out_lat: lat ?? null,
      punch_out_lng: lng ?? null,
      punch_out_location: location,
      total_hours: verdict.total_hours,
      status: verdict.status,
    })
    .eq('id', existing.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
