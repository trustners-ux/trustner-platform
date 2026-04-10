// ─── Trail Income DAL ───
// Manages MF trail commission entries for Trustner (ARN-286886)
// Trail = recurring commission AMCs pay on mutual fund AUM

import { isLocal, getCurrentMonth } from '@/lib/db/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { TRAIL_RATES } from '@/lib/mis/types';
import { EMPLOYEES } from '@/lib/mis/employee-data';
import { writeAuditLog } from './audit';

// ─── Types ───

export type SourceType = 'self_new_pan' | 'self_existing' | 'assigned_new' | 'assigned_no_new' | 'walk_in';
export type FundCategory = 'equity_active' | 'equity_index' | 'hybrid' | 'debt' | 'liquid';
export type TrailStatus = 'draft' | 'submitted' | 'approved';

export interface TrailEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  clientPan: string;
  clientName: string;
  sourceType: SourceType;
  fundCategory: FundCategory;
  amcName: string;
  schemeName: string;
  currentAum: number;
  trailRatePct: number;
  annualTrailAmount: number;
  monthlyTrailAmount: number;
  rmSharePct: number;
  rmMonthlyAmount: number;
  companySharePct: number;
  companyMonthlyAmount: number;
  month: string;
  status: TrailStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  notes?: string;
}

export interface TrailEntryInput {
  employeeId: number;
  clientPan: string;
  clientName: string;
  sourceType: SourceType;
  fundCategory: FundCategory;
  amcName: string;
  schemeName: string;
  currentAum: number;
  trailRatePct: number;
  month?: string;
  notes?: string;
}

export interface TrailEntryFilters {
  month?: string;
  employeeId?: number;
  status?: TrailStatus | 'all';
  sourceType?: SourceType;
  fundCategory?: FundCategory;
}

export interface TrailSummary {
  totalAum: number;
  totalAnnualTrail: number;
  totalMonthlyTrail: number;
  rmShare: number;
  companyShare: number;
  entryCount: number;
  byEmployee: {
    employeeId: number;
    employeeName: string;
    aum: number;
    monthlyTrail: number;
    rmShare: number;
    companyShare: number;
    clientCount: number;
  }[];
  byFundCategory: {
    category: FundCategory;
    label: string;
    aum: number;
    monthlyTrail: number;
    entryCount: number;
  }[];
  bySourceType: {
    sourceType: SourceType;
    label: string;
    aum: number;
    monthlyTrail: number;
    entryCount: number;
  }[];
}

export interface EmployeeTrailSummary {
  employeeId: number;
  employeeName: string;
  totalAum: number;
  totalMonthlyTrail: number;
  totalRmShare: number;
  clientCount: number;
  entries: TrailEntry[];
  bySourceType: { sourceType: SourceType; label: string; aum: number; monthlyTrail: number; count: number }[];
  byFundCategory: { category: FundCategory; label: string; aum: number; monthlyTrail: number; count: number }[];
}

// ─── Constants ───

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  self_new_pan: 'Self-Sourced New PAN',
  self_existing: 'Self-Sourced Existing',
  assigned_new: 'Assigned New Business',
  assigned_no_new: 'Assigned No New Business',
  walk_in: 'Office Walk-in',
};

export const FUND_CATEGORY_LABELS: Record<FundCategory, string> = {
  equity_active: 'Equity Active',
  equity_index: 'Equity Index',
  hybrid: 'Hybrid',
  debt: 'Debt',
  liquid: 'Liquid',
};

/** Default trail rate ranges from AMCs — mid-point used as auto-suggest */
export const FUND_TRAIL_RATE_DEFAULTS: Record<FundCategory, { min: number; max: number; default: number }> = {
  equity_active: { min: 0.70, max: 1.50, default: 1.00 },
  equity_index: { min: 0.30, max: 0.50, default: 0.40 },
  hybrid: { min: 0.50, max: 1.00, default: 0.75 },
  debt: { min: 0.20, max: 0.80, default: 0.50 },
  liquid: { min: 0.05, max: 0.15, default: 0.10 },
};

/** Map source type to TRAIL_RATES key */
const SOURCE_TO_TRAIL_KEY: Record<SourceType, keyof typeof TRAIL_RATES> = {
  self_new_pan: 'selfSourcedNewPan',
  self_existing: 'selfSourcedExisting',
  assigned_new: 'assignedNewBusiness',
  assigned_no_new: 'assignedNoNewBusiness',
  walk_in: 'officeWalkIn',
};

// ─── Helpers ───

function getEmployeeName(employeeId: number): string {
  return EMPLOYEES.find(e => e.id === employeeId)?.name || `Employee ${employeeId}`;
}

function getRmSharePct(sourceType: SourceType): number {
  const key = SOURCE_TO_TRAIL_KEY[sourceType];
  return TRAIL_RATES[key].rm;
}

function getCompanySharePct(sourceType: SourceType): number {
  const key = SOURCE_TO_TRAIL_KEY[sourceType];
  return TRAIL_RATES[key].company;
}

function computeTrailAmounts(aum: number, trailRatePct: number, sourceType: SourceType) {
  const annualTrailAmount = Math.round((aum * trailRatePct) / 100);
  const monthlyTrailAmount = Math.round(annualTrailAmount / 12);
  const rmSharePct = getRmSharePct(sourceType);
  const companySharePct = getCompanySharePct(sourceType);
  const rmMonthlyAmount = Math.round((monthlyTrailAmount * rmSharePct) / 100);
  const companyMonthlyAmount = monthlyTrailAmount - rmMonthlyAmount;
  return { annualTrailAmount, monthlyTrailAmount, rmSharePct, companySharePct, rmMonthlyAmount, companyMonthlyAmount };
}

// ─── Seed Data: 15 entries across employees for April 2026 ───

const SEED_TRAIL_ENTRIES: TrailEntry[] = [
  // Tamanna Somani (id:6) — MF head, self-sourced
  { id: 1, employeeId: 6, employeeName: 'Tamanna Somani', clientPan: 'ABCPS1234A', clientName: 'Rajesh Mehta', sourceType: 'self_new_pan', fundCategory: 'equity_active', amcName: 'SBI Mutual Fund', schemeName: 'SBI Bluechip Fund - Growth', currentAum: 2500000, trailRatePct: 1.00, ...computeTrailAmounts(2500000, 1.00, 'self_new_pan'), month: '2026-04', status: 'approved', approvedBy: 'ram@trustner.in', approvedAt: '2026-04-05T10:00:00Z', createdAt: '2026-04-01T09:00:00Z' },
  { id: 2, employeeId: 6, employeeName: 'Tamanna Somani', clientPan: 'BCDPT5678B', clientName: 'Sunita Agarwal', sourceType: 'self_existing', fundCategory: 'hybrid', amcName: 'HDFC Mutual Fund', schemeName: 'HDFC Balanced Advantage Fund', currentAum: 1800000, trailRatePct: 0.75, ...computeTrailAmounts(1800000, 0.75, 'self_existing'), month: '2026-04', status: 'approved', approvedBy: 'sangeeta@trustner.in', approvedAt: '2026-04-05T11:00:00Z', createdAt: '2026-04-01T09:15:00Z' },
  { id: 3, employeeId: 6, employeeName: 'Tamanna Somani', clientPan: 'CDEFG9012C', clientName: 'Anand Sharma', sourceType: 'self_new_pan', fundCategory: 'equity_index', amcName: 'UTI Mutual Fund', schemeName: 'UTI Nifty 50 Index Fund', currentAum: 3200000, trailRatePct: 0.40, ...computeTrailAmounts(3200000, 0.40, 'self_new_pan'), month: '2026-04', status: 'approved', approvedBy: 'ram@trustner.in', approvedAt: '2026-04-06T09:00:00Z', createdAt: '2026-04-02T08:30:00Z' },

  // Neha Agarwal (id:10) — MF Team Leader
  { id: 4, employeeId: 10, employeeName: 'Neha Agarwal', clientPan: 'DEFGH3456D', clientName: 'Priya Gupta', sourceType: 'self_new_pan', fundCategory: 'equity_active', amcName: 'ICICI Prudential', schemeName: 'ICICI Pru Bluechip Fund', currentAum: 1500000, trailRatePct: 1.10, ...computeTrailAmounts(1500000, 1.10, 'self_new_pan'), month: '2026-04', status: 'approved', approvedBy: 'ram@trustner.in', approvedAt: '2026-04-06T10:00:00Z', createdAt: '2026-04-02T09:00:00Z' },
  { id: 5, employeeId: 10, employeeName: 'Neha Agarwal', clientPan: 'EFGHI7890E', clientName: 'Mohan Das', sourceType: 'assigned_new', fundCategory: 'debt', amcName: 'Axis Mutual Fund', schemeName: 'Axis Short Term Fund', currentAum: 5000000, trailRatePct: 0.50, ...computeTrailAmounts(5000000, 0.50, 'assigned_new'), month: '2026-04', status: 'submitted', createdAt: '2026-04-03T10:00:00Z' },
  { id: 6, employeeId: 10, employeeName: 'Neha Agarwal', clientPan: 'FGHIJ2345F', clientName: 'Kavita Bora', sourceType: 'walk_in', fundCategory: 'liquid', amcName: 'Kotak Mutual Fund', schemeName: 'Kotak Liquid Fund', currentAum: 10000000, trailRatePct: 0.10, ...computeTrailAmounts(10000000, 0.10, 'walk_in'), month: '2026-04', status: 'approved', approvedBy: 'sangeeta@trustner.in', approvedAt: '2026-04-07T09:00:00Z', createdAt: '2026-04-03T11:00:00Z' },

  // Vikram Choudhury (id:14) — MF RM
  { id: 7, employeeId: 14, employeeName: 'Vikram Choudhury', clientPan: 'GHIJK6789G', clientName: 'Arun Kalita', sourceType: 'self_new_pan', fundCategory: 'equity_active', amcName: 'Mirae Asset', schemeName: 'Mirae Asset Large Cap Fund', currentAum: 800000, trailRatePct: 1.20, ...computeTrailAmounts(800000, 1.20, 'self_new_pan'), month: '2026-04', status: 'approved', approvedBy: 'ram@trustner.in', approvedAt: '2026-04-07T10:00:00Z', createdAt: '2026-04-04T08:00:00Z' },
  { id: 8, employeeId: 14, employeeName: 'Vikram Choudhury', clientPan: 'HIJKL0123H', clientName: 'Deepa Nath', sourceType: 'self_existing', fundCategory: 'hybrid', amcName: 'PPFAS Mutual Fund', schemeName: 'Parag Parikh Flexi Cap Fund', currentAum: 1200000, trailRatePct: 0.80, ...computeTrailAmounts(1200000, 0.80, 'self_existing'), month: '2026-04', status: 'draft', createdAt: '2026-04-04T09:30:00Z' },
  { id: 9, employeeId: 14, employeeName: 'Vikram Choudhury', clientPan: 'IJKLM4567I', clientName: 'Sanjay Bora', sourceType: 'assigned_no_new', fundCategory: 'equity_active', amcName: 'Nippon India', schemeName: 'Nippon India Large Cap Fund', currentAum: 2000000, trailRatePct: 0.90, ...computeTrailAmounts(2000000, 0.90, 'assigned_no_new'), month: '2026-04', status: 'submitted', createdAt: '2026-04-05T08:00:00Z' },

  // Anjali Shah (id:34) — New RM
  { id: 10, employeeId: 34, employeeName: 'Anjali Shah', clientPan: 'JKLMN8901J', clientName: 'Rohit Sharma', sourceType: 'self_new_pan', fundCategory: 'equity_active', amcName: 'DSP Mutual Fund', schemeName: 'DSP Equity Opportunities Fund', currentAum: 600000, trailRatePct: 1.00, ...computeTrailAmounts(600000, 1.00, 'self_new_pan'), month: '2026-04', status: 'approved', approvedBy: 'sangeeta@trustner.in', approvedAt: '2026-04-08T09:00:00Z', createdAt: '2026-04-05T10:00:00Z' },
  { id: 11, employeeId: 34, employeeName: 'Anjali Shah', clientPan: 'KLMNO2345K', clientName: 'Meera Devi', sourceType: 'walk_in', fundCategory: 'debt', amcName: 'ICICI Prudential', schemeName: 'ICICI Pru Corporate Bond Fund', currentAum: 2000000, trailRatePct: 0.40, ...computeTrailAmounts(2000000, 0.40, 'walk_in'), month: '2026-04', status: 'draft', createdAt: '2026-04-06T08:00:00Z' },

  // Ram Shah (id:1) — Director own clients
  { id: 12, employeeId: 1, employeeName: 'Ram Shah', clientPan: 'LMNOP6789L', clientName: 'Vikash Agarwal', sourceType: 'self_new_pan', fundCategory: 'equity_active', amcName: 'SBI Mutual Fund', schemeName: 'SBI Focused Equity Fund', currentAum: 5000000, trailRatePct: 1.10, ...computeTrailAmounts(5000000, 1.10, 'self_new_pan'), month: '2026-04', status: 'approved', approvedBy: 'ram@trustner.in', approvedAt: '2026-04-03T09:00:00Z', createdAt: '2026-04-01T08:00:00Z' },
  { id: 13, employeeId: 1, employeeName: 'Ram Shah', clientPan: 'MNOPQ0123M', clientName: 'Seema Hazarika', sourceType: 'self_existing', fundCategory: 'equity_index', amcName: 'HDFC Mutual Fund', schemeName: 'HDFC Nifty 50 Index Fund', currentAum: 8000000, trailRatePct: 0.35, ...computeTrailAmounts(8000000, 0.35, 'self_existing'), month: '2026-04', status: 'approved', approvedBy: 'sangeeta@trustner.in', approvedAt: '2026-04-04T09:00:00Z', createdAt: '2026-04-01T08:30:00Z' },
  { id: 14, employeeId: 1, employeeName: 'Ram Shah', clientPan: 'NOPQR4567N', clientName: 'Amit Choudhury', sourceType: 'self_new_pan', fundCategory: 'hybrid', amcName: 'PPFAS Mutual Fund', schemeName: 'Parag Parikh Conservative Hybrid', currentAum: 3500000, trailRatePct: 0.70, ...computeTrailAmounts(3500000, 0.70, 'self_new_pan'), month: '2026-04', status: 'approved', approvedBy: 'ram@trustner.in', approvedAt: '2026-04-05T08:00:00Z', createdAt: '2026-04-02T07:30:00Z' },

  // Sangita Shah (id:2) — Director
  { id: 15, employeeId: 2, employeeName: 'Sangita Shah', clientPan: 'OPQRS8901O', clientName: 'Lakshmi Dey', sourceType: 'assigned_new', fundCategory: 'equity_active', amcName: 'Axis Mutual Fund', schemeName: 'Axis Growth Opportunities Fund', currentAum: 1500000, trailRatePct: 0.95, ...computeTrailAmounts(1500000, 0.95, 'assigned_new'), month: '2026-04', status: 'approved', approvedBy: 'ram@trustner.in', approvedAt: '2026-04-06T08:00:00Z', createdAt: '2026-04-03T08:00:00Z' },
];

// ─── In-memory store for local mode ───
let localEntries = [...SEED_TRAIL_ENTRIES];
let localNextId = localEntries.length + 1;

// ─── Map Supabase row to TrailEntry ───
function mapRow(row: Record<string, unknown>): TrailEntry {
  return {
    id: row.id as number,
    employeeId: row.employee_id as number,
    employeeName: (row.employee_name as string) || getEmployeeName(row.employee_id as number),
    clientPan: row.client_pan as string,
    clientName: row.client_name as string,
    sourceType: row.source_type as SourceType,
    fundCategory: row.fund_category as FundCategory,
    amcName: row.amc_name as string,
    schemeName: row.scheme_name as string,
    currentAum: Number(row.current_aum) || 0,
    trailRatePct: Number(row.trail_rate_pct) || 0,
    annualTrailAmount: Number(row.annual_trail_amount) || 0,
    monthlyTrailAmount: Number(row.monthly_trail_amount) || 0,
    rmSharePct: Number(row.rm_share_pct) || 0,
    rmMonthlyAmount: Number(row.rm_monthly_amount) || 0,
    companySharePct: Number(row.company_share_pct) || 0,
    companyMonthlyAmount: Number(row.company_monthly_amount) || 0,
    month: row.month as string,
    status: (row.status as TrailStatus) || 'draft',
    approvedBy: row.approved_by as string | undefined,
    approvedAt: row.approved_at as string | undefined,
    createdAt: row.created_at as string,
    notes: row.notes as string | undefined,
  };
}

// ─── Apply local filters ───
function applyFilters(entries: TrailEntry[], filters?: TrailEntryFilters): TrailEntry[] {
  if (!filters) return entries;
  let result = [...entries];
  if (filters.month) result = result.filter(e => e.month === filters.month);
  if (filters.employeeId) result = result.filter(e => e.employeeId === filters.employeeId);
  if (filters.status && filters.status !== 'all') result = result.filter(e => e.status === filters.status);
  if (filters.sourceType) result = result.filter(e => e.sourceType === filters.sourceType);
  if (filters.fundCategory) result = result.filter(e => e.fundCategory === filters.fundCategory);
  return result;
}

// ═══════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════

/**
 * Create a new trail entry with auto-computed amounts
 */
export async function createTrailEntry(input: TrailEntryInput, createdBy: string): Promise<TrailEntry> {
  const amounts = computeTrailAmounts(input.currentAum, input.trailRatePct, input.sourceType);
  const month = input.month || getCurrentMonth();
  const employeeName = getEmployeeName(input.employeeId);

  if (isLocal) {
    const entry: TrailEntry = {
      id: localNextId++,
      employeeId: input.employeeId,
      employeeName,
      clientPan: input.clientPan,
      clientName: input.clientName,
      sourceType: input.sourceType,
      fundCategory: input.fundCategory,
      amcName: input.amcName,
      schemeName: input.schemeName,
      currentAum: input.currentAum,
      trailRatePct: input.trailRatePct,
      ...amounts,
      month,
      status: 'draft',
      createdAt: new Date().toISOString(),
      notes: input.notes,
    };
    localEntries.push(entry);

    await writeAuditLog({
      tableName: 'trail_income',
      recordId: entry.id,
      action: 'INSERT',
      changedBy: createdBy,
      newValues: { clientName: input.clientName, aum: input.currentAum, trailRate: input.trailRatePct },
    });

    return entry;
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  const { data, error } = await sb
    .from('trail_income')
    .insert({
      employee_id: input.employeeId,
      employee_name: employeeName,
      client_pan: input.clientPan,
      client_name: input.clientName,
      source_type: input.sourceType,
      fund_category: input.fundCategory,
      amc_name: input.amcName,
      scheme_name: input.schemeName,
      current_aum: input.currentAum,
      trail_rate_pct: input.trailRatePct,
      annual_trail_amount: amounts.annualTrailAmount,
      monthly_trail_amount: amounts.monthlyTrailAmount,
      rm_share_pct: amounts.rmSharePct,
      rm_monthly_amount: amounts.rmMonthlyAmount,
      company_share_pct: amounts.companySharePct,
      company_monthly_amount: amounts.companyMonthlyAmount,
      month,
      status: 'draft',
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Trail entry insert failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'trail_income',
    recordId: data.id,
    action: 'INSERT',
    changedBy: createdBy,
    newValues: { clientName: input.clientName, aum: input.currentAum },
  });

  return mapRow(data);
}

/**
 * Get a single trail entry by ID
 */
export async function getTrailEntry(id: number): Promise<TrailEntry | undefined> {
  if (isLocal) {
    return localEntries.find(e => e.id === id);
  }

  const sb = getSupabaseAdmin();
  if (!sb) return undefined;

  const { data, error } = await sb.from('trail_income').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return mapRow(data);
}

/**
 * List trail entries with optional filters
 */
export async function listTrailEntries(filters?: TrailEntryFilters): Promise<TrailEntry[]> {
  if (isLocal) {
    return applyFilters(localEntries, filters);
  }

  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  let query = sb.from('trail_income').select('*');
  if (filters?.month) query = query.eq('month', filters.month);
  if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters?.sourceType) query = query.eq('source_type', filters.sourceType);
  if (filters?.fundCategory) query = query.eq('fund_category', filters.fundCategory);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Trail income query failed: ${error.message}`);

  return (data || []).map(mapRow);
}

/**
 * Approve a single trail entry
 */
export async function approveTrailEntry(
  id: number,
  approverEmail: string,
  approverName: string
): Promise<TrailEntry> {
  if (isLocal) {
    const idx = localEntries.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`Trail entry ${id} not found`);
    const entry = localEntries[idx];
    if (entry.status === 'approved') throw new Error('Entry already approved');

    localEntries[idx] = {
      ...entry,
      status: 'approved',
      approvedBy: approverEmail,
      approvedAt: new Date().toISOString(),
    };

    await writeAuditLog({
      tableName: 'trail_income',
      recordId: id,
      action: 'APPROVE',
      changedBy: approverEmail,
      newValues: { approvedBy: approverEmail },
    });

    return localEntries[idx];
  }

  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  const { data, error } = await sb
    .from('trail_income')
    .update({
      status: 'approved',
      approved_by: approverEmail,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .in('status', ['draft', 'submitted'])
    .select()
    .single();

  if (error) throw new Error(`Trail approve failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'trail_income',
    recordId: id,
    action: 'APPROVE',
    changedBy: approverEmail,
  });

  return mapRow(data);
}

/**
 * Bulk approve trail entries — returns count of approved entries
 */
export async function bulkApproveTrailEntries(
  ids: number[],
  approverEmail: string,
  approverName: string
): Promise<number> {
  if (ids.length === 0) return 0;

  if (isLocal) {
    let count = 0;
    for (const id of ids) {
      const idx = localEntries.findIndex(e => e.id === id);
      if (idx !== -1 && localEntries[idx].status !== 'approved') {
        localEntries[idx] = {
          ...localEntries[idx],
          status: 'approved',
          approvedBy: approverEmail,
          approvedAt: new Date().toISOString(),
        };
        count++;
      }
    }

    await writeAuditLog({
      tableName: 'trail_income',
      action: 'APPROVE',
      changedBy: approverEmail,
      newValues: { action: 'bulk_approve', ids, count },
    });

    return count;
  }

  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  const { data, error } = await sb
    .from('trail_income')
    .update({
      status: 'approved',
      approved_by: approverEmail,
      approved_at: new Date().toISOString(),
    })
    .in('id', ids)
    .in('status', ['draft', 'submitted'])
    .select();

  if (error) throw new Error(`Bulk approve failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'trail_income',
    action: 'APPROVE',
    changedBy: approverEmail,
    newValues: { action: 'bulk_approve', count: data?.length },
  });

  return data?.length || 0;
}

/**
 * Get aggregated trail summary (all employees or for a specific month)
 */
export async function getTrailSummary(month?: string): Promise<TrailSummary> {
  const entries = await listTrailEntries(month ? { month } : undefined);

  let totalAum = 0;
  let totalAnnualTrail = 0;
  let totalMonthlyTrail = 0;
  let rmShare = 0;
  let companyShare = 0;

  const employeeMap = new Map<number, { name: string; aum: number; monthlyTrail: number; rmShare: number; companyShare: number; clients: Set<string> }>();
  const categoryMap = new Map<FundCategory, { aum: number; monthlyTrail: number; count: number }>();
  const sourceMap = new Map<SourceType, { aum: number; monthlyTrail: number; count: number }>();

  for (const e of entries) {
    totalAum += e.currentAum;
    totalAnnualTrail += e.annualTrailAmount;
    totalMonthlyTrail += e.monthlyTrailAmount;
    rmShare += e.rmMonthlyAmount;
    companyShare += e.companyMonthlyAmount;

    // By employee
    const emp = employeeMap.get(e.employeeId) || { name: e.employeeName, aum: 0, monthlyTrail: 0, rmShare: 0, companyShare: 0, clients: new Set<string>() };
    emp.aum += e.currentAum;
    emp.monthlyTrail += e.monthlyTrailAmount;
    emp.rmShare += e.rmMonthlyAmount;
    emp.companyShare += e.companyMonthlyAmount;
    emp.clients.add(e.clientPan);
    employeeMap.set(e.employeeId, emp);

    // By fund category
    const cat = categoryMap.get(e.fundCategory) || { aum: 0, monthlyTrail: 0, count: 0 };
    cat.aum += e.currentAum;
    cat.monthlyTrail += e.monthlyTrailAmount;
    cat.count += 1;
    categoryMap.set(e.fundCategory, cat);

    // By source type
    const src = sourceMap.get(e.sourceType) || { aum: 0, monthlyTrail: 0, count: 0 };
    src.aum += e.currentAum;
    src.monthlyTrail += e.monthlyTrailAmount;
    src.count += 1;
    sourceMap.set(e.sourceType, src);
  }

  const byEmployee = Array.from(employeeMap.entries())
    .map(([employeeId, data]) => ({
      employeeId,
      employeeName: data.name,
      aum: data.aum,
      monthlyTrail: data.monthlyTrail,
      rmShare: data.rmShare,
      companyShare: data.companyShare,
      clientCount: data.clients.size,
    }))
    .sort((a, b) => b.aum - a.aum);

  const byFundCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      label: FUND_CATEGORY_LABELS[category],
      aum: data.aum,
      monthlyTrail: data.monthlyTrail,
      entryCount: data.count,
    }))
    .sort((a, b) => b.aum - a.aum);

  const bySourceType = Array.from(sourceMap.entries())
    .map(([sourceType, data]) => ({
      sourceType,
      label: SOURCE_TYPE_LABELS[sourceType],
      aum: data.aum,
      monthlyTrail: data.monthlyTrail,
      entryCount: data.count,
    }))
    .sort((a, b) => b.aum - a.aum);

  return {
    totalAum,
    totalAnnualTrail,
    totalMonthlyTrail,
    rmShare,
    companyShare,
    entryCount: entries.length,
    byEmployee,
    byFundCategory,
    bySourceType,
  };
}

/**
 * Get trail summary for a specific employee
 */
export async function getEmployeeTrailSummary(
  employeeId: number,
  month?: string
): Promise<EmployeeTrailSummary> {
  const filters: TrailEntryFilters = { employeeId };
  if (month) filters.month = month;
  const entries = await listTrailEntries(filters);

  let totalAum = 0;
  let totalMonthlyTrail = 0;
  let totalRmShare = 0;
  const clientPans = new Set<string>();

  const sourceAgg = new Map<SourceType, { aum: number; monthlyTrail: number; count: number }>();
  const categoryAgg = new Map<FundCategory, { aum: number; monthlyTrail: number; count: number }>();

  for (const e of entries) {
    totalAum += e.currentAum;
    totalMonthlyTrail += e.monthlyTrailAmount;
    totalRmShare += e.rmMonthlyAmount;
    clientPans.add(e.clientPan);

    const src = sourceAgg.get(e.sourceType) || { aum: 0, monthlyTrail: 0, count: 0 };
    src.aum += e.currentAum;
    src.monthlyTrail += e.monthlyTrailAmount;
    src.count += 1;
    sourceAgg.set(e.sourceType, src);

    const cat = categoryAgg.get(e.fundCategory) || { aum: 0, monthlyTrail: 0, count: 0 };
    cat.aum += e.currentAum;
    cat.monthlyTrail += e.monthlyTrailAmount;
    cat.count += 1;
    categoryAgg.set(e.fundCategory, cat);
  }

  return {
    employeeId,
    employeeName: getEmployeeName(employeeId),
    totalAum,
    totalMonthlyTrail,
    totalRmShare,
    clientCount: clientPans.size,
    entries,
    bySourceType: Array.from(sourceAgg.entries()).map(([sourceType, data]) => ({
      sourceType,
      label: SOURCE_TYPE_LABELS[sourceType],
      ...data,
    })),
    byFundCategory: Array.from(categoryAgg.entries()).map(([category, data]) => ({
      category,
      label: FUND_CATEGORY_LABELS[category],
      ...data,
    })),
  };
}
