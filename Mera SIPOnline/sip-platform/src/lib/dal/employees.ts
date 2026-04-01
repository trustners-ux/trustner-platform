// ─── Employee DAL ───
// Abstracts employee data access — works with local data or Supabase

import { isLocal } from '@/lib/db/config';
import { EMPLOYEES } from '@/lib/mis/employee-data';
import { Employee, Entity, Segment } from '@/lib/mis/types';
import { writeAuditLog } from './audit';

export interface EmployeeFilters {
  entity?: Entity;
  segment?: Segment;
  isActive?: boolean;
  search?: string;
  levelCode?: string;
  department?: string;
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

  // TODO: Supabase query with filters
  return [];
}

export async function getEmployeeById(id: number): Promise<Employee | null> {
  if (isLocal) {
    return EMPLOYEES.find(e => e.id === id) || null;
  }
  return null;
}

export async function getEmployeeByCode(code: string): Promise<Employee | null> {
  if (isLocal) {
    return EMPLOYEES.find(e => e.employeeCode === code) || null;
  }
  return null;
}

export async function getEmployeeByPhone(phone: string): Promise<Employee | null> {
  if (isLocal) {
    return EMPLOYEES.find(e => e.phone === phone) || null;
  }
  return null;
}

export async function getEmployeesByManager(managerId: number): Promise<Employee[]> {
  if (isLocal) {
    return EMPLOYEES.filter(e => e.reportingManagerId === managerId && e.isActive);
  }
  return [];
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
