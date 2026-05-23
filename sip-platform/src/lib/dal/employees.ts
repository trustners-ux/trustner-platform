// ─── Employee DAL ───
// Abstracts employee data access — works with local data or Supabase

import { isLocal } from '@/lib/db/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { EMPLOYEES } from '@/lib/mis/employee-data';
import { Employee, Entity, Segment, LevelCode } from '@/lib/mis/types';
import { writeAuditLog } from './audit';

export interface EmployeeFilters {
  entity?: Entity;
  segment?: Segment;
  isActive?: boolean;
  search?: string;
  levelCode?: string;
  department?: string;
}

// ─── Map Supabase DB row to Employee type ───
function mapRow(row: Record<string, unknown>): Employee {
  return {
    id: row.id as number,
    employeeCode: row.employee_code as string,
    name: row.name as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    doj: row.doj as string,
    designation: row.designation as string,
    department: row.department as string,
    jobResponsibility: row.job_responsibility as string | undefined,
    grossSalary: Number(row.gross_salary) || 0,
    entity: row.entity as Entity,
    annualCTC: Number(row.annual_ctc) || 0,
    tenureYears: Number(row.tenure_years) || 0,
    levelCode: row.level_code as LevelCode,
    segment: row.segment as Segment,
    reportingManagerId: row.reporting_manager_id as number | undefined,
    location: row.location as string | undefined,
    targetMultiplier: Number(row.target_multiplier) || 0,
    monthlyTarget: Number(row.monthly_target) || 0,
    annualTarget: Number(row.annual_target) || 0,
    costRecoveryMin: Number(row.cost_recovery_min) || 0,
    isActive: row.is_active as boolean,
  };
}

export async function getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  if (isLocal) {
    let result = [...EMPLOYEES];
    if (filters?.entity) result = result.filter(e => e.entity === filters.entity);
    if (filters?.segment) result = result.filter(e => e.segment === filters.segment);
    if (filters?.isActive !== undefined) result = result.filter(e => e.isActive === filters.isActive);
    if (filters?.levelCode) result = result.filter(e => e.levelCode === filters.levelCode);
    if (filters?.department) result = result.filter(e => e.department === filters.department);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        e => e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q)
      );
    }
    return result;
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  let query = sb.from('employees').select('*');

  if (filters?.entity) query = query.eq('entity', filters.entity);
  if (filters?.segment) query = query.eq('segment', filters.segment);
  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);
  if (filters?.levelCode) query = query.eq('level_code', filters.levelCode);
  if (filters?.department) query = query.eq('department', filters.department);
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('id');
  if (error) throw new Error(`Supabase employees query failed: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function getEmployeeById(id: number): Promise<Employee | null> {
  if (isLocal) {
    return EMPLOYEES.find(e => e.id === id) || null;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from('employees').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getEmployeeByCode(code: string): Promise<Employee | null> {
  if (isLocal) {
    return EMPLOYEES.find(e => e.employeeCode === code) || null;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from('employees').select('*').eq('employee_code', code).single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getEmployeeByPhone(phone: string): Promise<Employee | null> {
  if (isLocal) {
    return EMPLOYEES.find(e => e.phone === phone) || null;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from('employees').select('*').eq('phone', phone).single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getEmployeesByManager(managerId: number): Promise<Employee[]> {
  if (isLocal) {
    return EMPLOYEES.filter(e => e.reportingManagerId === managerId && e.isActive);
  }

  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from('employees')
    .select('*')
    .eq('reporting_manager_id', managerId)
    .eq('is_active', true);
  if (error) return [];
  return (data || []).map(mapRow);
}

export async function getSalesEmployees(): Promise<Employee[]> {
  return getEmployees({ isActive: true }).then(
    emps => emps.filter(e => e.monthlyTarget > 0)
  );
}

export async function getEmployeeStats() {
  const all = await getEmployees({ isActive: true });
  const sales = all.filter(e => e.monthlyTarget > 0);

  return {
    totalActive: all.length,
    totalSales: sales.length,
    totalSupport: all.length - sales.length,
    tibCount: all.filter(e => e.entity === 'TIB').length,
    tasCount: all.filter(e => e.entity === 'TAS').length,
    totalMonthlyPayroll: all.reduce((s, e) => s + e.grossSalary, 0),
    totalMonthlyTarget: sales.reduce((s, e) => s + e.monthlyTarget, 0),
  };
}

export async function updateEmployee(
  id: number,
  updates: Partial<Employee>,
  changedBy: string
): Promise<Employee | null> {
  if (isLocal) {
    // Local mode: no mutation (read-only seed data)
    return getEmployeeById(id);
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // Map camelCase to snake_case for Supabase
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.designation !== undefined) dbUpdates.designation = updates.designation;
  if (updates.department !== undefined) dbUpdates.department = updates.department;
  if (updates.grossSalary !== undefined) dbUpdates.gross_salary = updates.grossSalary;
  if (updates.monthlyTarget !== undefined) dbUpdates.monthly_target = updates.monthlyTarget;
  if (updates.annualTarget !== undefined) dbUpdates.annual_target = updates.annualTarget;
  if (updates.segment !== undefined) dbUpdates.segment = updates.segment;
  if (updates.levelCode !== undefined) dbUpdates.level_code = updates.levelCode;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.targetMultiplier !== undefined) dbUpdates.target_multiplier = updates.targetMultiplier;

  const { data: oldData } = await sb.from('employees').select('*').eq('id', id).single();

  const { data, error } = await sb
    .from('employees')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Employee update failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'employees',
    recordId: id,
    action: 'UPDATE',
    changedBy,
    oldValues: oldData ? { name: oldData.name, designation: oldData.designation } : undefined,
    newValues: dbUpdates,
  });

  return data ? mapRow(data) : null;
}
