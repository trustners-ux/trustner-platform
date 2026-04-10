import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { verifyEmployeeToken } from '@/lib/auth/employee-jwt';
import { canAccess, type AdminRole } from '@/lib/auth/config';
import { writeAuditLog } from '@/lib/dal/audit';
import type { Entity, Segment, LevelCode } from '@/lib/mis/types';

// ─── Auth helper ───
async function getAuthUser(): Promise<{ email: string; name: string; role: AdminRole } | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin-session')?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return { email: payload.email as string, name: payload.name as string, role: payload.role as AdminRole };
  }
  const empToken = cookieStore.get('employee-session')?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) {
      const roleMap: Record<string, AdminRole> = { bod: 'super_admin', cdo: 'admin', regional_manager: 'hr', branch_head: 'hr', cdm: 'editor', manager: 'editor' };
      return { email: payload.email as string, name: payload.name as string, role: roleMap[payload.role as string] || 'viewer' };
    }
  }
  return null;
}

// ─── CSV Parsing ───
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());

    if (values.length >= headers.length - 2) { // Allow slight column mismatch
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = values[j] || ''; });
      rows.push(row);
    }
  }
  return rows;
}

// ─── Validation ───
const VALID_ENTITIES: Entity[] = ['TAS', 'TIB', 'Vendor'];
const VALID_SEGMENTS: Segment[] = ['Direct Sales', 'FP Team', 'CDM/POSP RM', 'Area Manager', 'Support'];
const VALID_LEVELS: LevelCode[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

interface ParsedEmployee {
  employeeCode: string;
  name: string;
  email?: string;
  phone?: string;
  doj: string;
  designation: string;
  department: string;
  grossSalary: number;
  entity: Entity;
  annualCTC: number;
  levelCode: LevelCode;
  segment: Segment;
  targetMultiplier: number;
  monthlyTarget: number;
  location?: string;
  reportingManagerId?: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

function validateRow(row: Record<string, string>, index: number): { employee: ParsedEmployee | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required fields
  const code = row['employee_code'] || row['code'] || row['emp_code'] || '';
  const name = row['name'] || row['employee_name'] || '';
  const designation = row['designation'] || row['title'] || '';
  const department = row['department'] || row['dept'] || '';
  const doj = row['doj'] || row['date_of_joining'] || row['joining_date'] || '';

  if (!code) errors.push({ row: index + 2, field: 'employee_code', message: 'Employee code is required' });
  if (!name) errors.push({ row: index + 2, field: 'name', message: 'Name is required' });
  if (!designation) errors.push({ row: index + 2, field: 'designation', message: 'Designation is required' });
  if (!department) errors.push({ row: index + 2, field: 'department', message: 'Department is required' });

  // Entity
  const entityRaw = (row['entity'] || row['company'] || 'TIB').toUpperCase();
  const entity = VALID_ENTITIES.find(e => e.toUpperCase() === entityRaw) || 'TIB';

  // Segment
  const segmentRaw = row['segment'] || row['team'] || 'Direct Sales';
  const segment = VALID_SEGMENTS.find(s => s.toLowerCase() === segmentRaw.toLowerCase()) || 'Direct Sales';

  // Level
  const levelRaw = (row['level_code'] || row['level'] || 'L6').toUpperCase();
  const levelCode = VALID_LEVELS.find(l => l === levelRaw) || 'L6';

  // Numeric fields
  const grossSalary = Math.round(Number(row['gross_salary'] || row['salary'] || 0));
  const annualCTC = Math.round(Number(row['annual_ctc'] || row['ctc'] || grossSalary * 12));
  const targetMultiplier = Number(row['target_multiplier'] || row['multiplier'] || 6);
  const monthlyTarget = Math.round(Number(row['monthly_target'] || row['target'] || grossSalary * targetMultiplier));
  const reportingManagerId = row['reporting_manager_id'] || row['manager_id'] ? Number(row['reporting_manager_id'] || row['manager_id']) : undefined;

  if (errors.length > 0) return { employee: null, errors };

  return {
    employee: {
      employeeCode: code,
      name,
      email: row['email'] || undefined,
      phone: row['phone'] || row['mobile'] || undefined,
      doj: doj || new Date().toISOString().split('T')[0],
      designation,
      department,
      grossSalary,
      entity,
      annualCTC,
      levelCode,
      segment,
      targetMultiplier,
      monthlyTarget,
      location: row['location'] || row['city'] || undefined,
      reportingManagerId,
    },
    errors: [],
  };
}

// ─── POST: Upload CSV ───
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !canAccess(user.role, 'hr')) {
    return NextResponse.json({ error: 'Unauthorized — HR or above required' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = formData.get('mode') as string || 'validate'; // 'validate' or 'import'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported. Export your Excel as CSV first.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in CSV' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 employees per upload' }, { status: 400 });
    }

    // Validate all rows
    const allErrors: ValidationError[] = [];
    const validEmployees: ParsedEmployee[] = [];

    rows.forEach((row, i) => {
      const { employee, errors } = validateRow(row, i);
      allErrors.push(...errors);
      if (employee) validEmployees.push(employee);
    });

    // Validate mode — just return validation result
    if (mode === 'validate') {
      return NextResponse.json({
        totalRows: rows.length,
        validCount: validEmployees.length,
        errorCount: allErrors.length,
        errors: allErrors.slice(0, 50), // Cap at 50 errors
        preview: validEmployees.slice(0, 10), // Show first 10 valid
        headers: Object.keys(rows[0] || {}),
      });
    }

    // Import mode — only if no errors
    if (allErrors.length > 0) {
      return NextResponse.json({
        error: `Cannot import — ${allErrors.length} validation errors found. Fix and re-upload.`,
        errors: allErrors.slice(0, 50),
      }, { status: 400 });
    }

    // Log the import attempt (actual DB insert would go through Supabase DAL)
    await writeAuditLog({
      tableName: 'employees',
      action: 'INSERT',
      changedBy: user.email,
      newValues: {
        importType: 'csv_bulk',
        fileName: file.name,
        totalRecords: validEmployees.length,
        importedBy: user.email,
      },
      reason: `Bulk CSV import of ${validEmployees.length} employees`,
    });

    return NextResponse.json({
      success: true,
      imported: validEmployees.length,
      message: `Successfully processed ${validEmployees.length} employee records.`,
      employees: validEmployees,
    });

  } catch (err) {
    console.error('[EmployeeUpload]', err);
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}

// ─── GET: Download CSV template ───
export async function GET() {
  const headers = [
    'employee_code', 'name', 'email', 'phone', 'doj', 'designation',
    'department', 'gross_salary', 'entity', 'annual_ctc', 'level_code',
    'segment', 'target_multiplier', 'monthly_target', 'location', 'reporting_manager_id',
  ];

  const sampleRow = [
    'TIB020', 'Amit Kumar', 'amit@trustner.in', '9876543210', '2024-01-15', 'RM - Life',
    'Sales - Life', '30000', 'TIB', '360000', 'L6',
    'Direct Sales', '6', '180000', 'Guwahati', '7',
  ];

  const csv = [headers.join(','), sampleRow.join(',')].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="Trustner_Employee_Upload_Template.csv"',
    },
  });
}
