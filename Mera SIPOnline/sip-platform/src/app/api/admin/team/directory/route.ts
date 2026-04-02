import { NextResponse } from 'next/server';
import {
  getAllActiveEmployees,
  getDirectReports,
  findEmployeeById,
} from '@/lib/employee/employee-directory';

/**
 * GET /api/admin/team/directory
 * Returns the full employee directory for admin/manager view.
 */
export async function GET() {
  try {
    const employees = getAllActiveEmployees().map((emp) => {
      const head = emp.reportingHeadId ? findEmployeeById(emp.reportingHeadId) : null;
      const directReports = getDirectReports(emp.id);

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        companyGroup: emp.companyGroup,
        jobLocation: emp.jobLocation,
        role: emp.role,
        doj: emp.doj,
        reportingHeadName: head?.name || '—',
        directReports: directReports.length,
      };
    });

    return NextResponse.json({ employees });
  } catch (err) {
    console.error('[TeamDirectory]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
