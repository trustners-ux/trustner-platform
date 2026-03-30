// ─────────────────────────────────────────────────────────
// MFD Trail Commission Constants
// Internal business planning tool
// ─────────────────────────────────────────────────────────

export const TRAIL_RATES = {
  equity: { min: 0.3, max: 1.5, default: 0.8, label: 'Equity Funds' },
  debt: { min: 0.05, max: 0.8, default: 0.3, label: 'Debt Funds' },
  hybrid: { min: 0.2, max: 1.0, default: 0.6, label: 'Hybrid Funds' },
  index: { min: 0.03, max: 0.4, default: 0.15, label: 'Index/ETF' },
  liquid: { min: 0.03, max: 0.2, default: 0.1, label: 'Liquid Funds' },
} as const;

export const MFD_CONSTANTS = {
  title: 'MFD Business Planner',
  subtitle: 'Trail Commission Income Projections',
  badge: 'For Authorized Distributors Only',
} as const;

// Typical blended trail rate for a diversified MFD portfolio
export const DEFAULT_BLENDED_TRAIL = 0.8; // 0.8% p.a.

// Insurance commission rates (typical LIC/traditional policy)
export const INSURANCE_COMMISSION = {
  year1: 0.30,       // 30% first year commission
  year2to3: 0.075,   // 7.5% renewal commission
  year4plus: 0.05,   // 5% renewal commission
} as const;

export const MFD_DISCLAIMER = {
  trail: 'Trail commission rates are indicative and vary by AMC, scheme, and plan type. Actual trail income depends on the specific schemes distributed and is subject to change by AMCs.',
  internal: 'This tool is for internal business planning purposes only. Not for public distribution or client-facing use.',
  general: 'Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. Past performance does not guarantee future returns.',
} as const;

export const MFD_TABS = [
  { id: 'new-sip', label: 'New SIP Trail', shortLabel: 'New SIP' },
  { id: 'lumpsum', label: 'Lump Sum Trail', shortLabel: 'Lump Sum' },
  { id: 'sip-book', label: 'SIP Book Growth', shortLabel: 'SIP Book' },
  { id: 'aum-growth', label: 'AUM Growth', shortLabel: 'AUM' },
  { id: 'comprehensive', label: 'Income Projection', shortLabel: 'Full View' },
  { id: 'target', label: 'Target Income', shortLabel: 'Target' },
  { id: 'insurance-vs-mf', label: 'Insurance vs MF', shortLabel: 'Compare' },
  { id: 'sub-broker', label: 'Sub-Broker Scale', shortLabel: 'Scale' },
] as const;

export const MFD_COLORS = {
  aum: '#0F766E',
  trail: '#D4A017',
  invested: '#64748B',
  milestone: '#E8553A',
  insurance: '#DC2626',
  mf: '#E8553A',
  cumulative: '#D4A017',
} as const;

export const CLIENT_PRESETS = [
  { clients: 100, label: 'Starting Out' },
  { clients: 250, label: 'Growing' },
  { clients: 500, label: 'Established' },
  { clients: 1000, label: 'Senior MFD' },
  { clients: 2000, label: 'Agency' },
] as const;
