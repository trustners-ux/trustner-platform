/**
 * Attendance helpers — used by both punch + summary endpoints.
 *
 * Assumptions (defaults; adjustable per company policy in future):
 *   - Working hours: 9:00 AM – 6:00 PM IST
 *   - Late threshold: punch_in > 9:30 AM = 'late'
 *   - Half-day threshold: total_hours < 4 = 'half_day'
 *   - Full day: total_hours >= 8
 *   - Weekly off: Sundays. Saturdays vary — alternate-Saturday off in many
 *     Indian SMBs; for now we mark Saturday as working unless overridden.
 *   - WFH: marker on punch — does not get geofence check.
 *
 * Distance computation uses the Haversine formula.
 */

export const WORK_START_HOUR = 9;
export const LATE_AFTER_HOUR = 9;
export const LATE_AFTER_MIN = 30;
export const HALF_DAY_MAX_HOURS = 4;
export const FULL_DAY_MIN_HOURS = 8;

/** Compute Haversine distance in metres between two lat/lng points */
export function haversineMeters(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371000; // metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function computeStatus(opts: {
  punch_in?: Date | null;
  punch_out?: Date | null;
  is_wfh?: boolean;
  is_holiday?: boolean;
  is_weekly_off?: boolean;
  is_on_leave?: boolean;
}): { status: string; total_hours: number | null } {
  if (opts.is_holiday) return { status: 'holiday', total_hours: 0 };
  if (opts.is_weekly_off) return { status: 'weekly_off', total_hours: 0 };
  if (opts.is_on_leave) return { status: 'leave', total_hours: 0 };
  if (!opts.punch_in) return { status: 'absent', total_hours: 0 };

  let total_hours: number | null = null;
  if (opts.punch_in && opts.punch_out) {
    total_hours = Math.round(
      (opts.punch_out.getTime() - opts.punch_in.getTime()) / 1000 / 3600 * 100
    ) / 100;
  }
  if (opts.is_wfh) {
    if (total_hours !== null && total_hours < HALF_DAY_MAX_HOURS) return { status: 'half_day', total_hours };
    return { status: 'wfh', total_hours };
  }

  // Office attendance
  const inHour = opts.punch_in.getHours();
  const inMin = opts.punch_in.getMinutes();
  const isLate =
    inHour > LATE_AFTER_HOUR ||
    (inHour === LATE_AFTER_HOUR && inMin > LATE_AFTER_MIN);

  if (total_hours !== null && total_hours < HALF_DAY_MAX_HOURS) {
    return { status: 'half_day', total_hours };
  }
  return { status: isLate ? 'late' : 'present', total_hours };
}
