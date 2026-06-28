/**
 * HR offices master.
 * 5 Trustner offices spread across Assam, Karnataka, West Bengal, Telangana.
 * Office codes are the canonical reference used by:
 *   - hr_employees.office_code
 *   - hr_holidays.office_codes[]
 *   - hr_attendance_logs (Phase 4 geofencing)
 */

export interface Office {
  code: string;
  name: string;
  city: string;
  state: string;
  shortLabel: string;       // "Guwahati (HO)" — for compact UI
}

/**
 * Fallback list — used if the DB lookup hasn't seeded yet or the network call
 * fails. Kept in sync with migration 019 hr_offices seed.
 */
export const FALLBACK_OFFICES: Office[] = [
  { code: 'HO_GHY', name: 'Head Office',      city: 'Guwahati',  state: 'Assam',       shortLabel: 'Guwahati (HO)' },
  { code: 'BR_TEZ', name: 'Branch Office',    city: 'Tezpur',    state: 'Assam',       shortLabel: 'Tezpur (Branch)' },
  { code: 'CO_BLR', name: 'Corporate Office', city: 'Bangalore', state: 'Karnataka',   shortLabel: 'Bangalore (Corp)' },
  { code: 'RO_KOL', name: 'Regional Office',  city: 'Kolkata',   state: 'West Bengal', shortLabel: 'Kolkata (Regional)' },
  { code: 'BR_HYD', name: 'Branch Office',    city: 'Hyderabad', state: 'Telangana',   shortLabel: 'Hyderabad (Branch)' },
];

export function officeLabel(code: string | null | undefined, offices: Office[] = FALLBACK_OFFICES): string {
  if (!code) return '—';
  const found = offices.find((o) => o.code === code);
  return found?.shortLabel || code;
}
