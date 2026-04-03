import { NextRequest, NextResponse } from 'next/server';
import { createBusinessEntry } from '@/lib/dal/business-entries';
import { getEmployees } from '@/lib/dal/employees';
import { PRODUCTS } from '@/lib/mis/employee-data';
import { getCurrentMonth } from '@/lib/db/config';
import {
  parseCSV,
  parseExcel,
  detectFormat,
  autoMapColumns,
  fuzzyMatchProduct,
  type ColumnMapping,
  type SystemField,
} from '@/lib/utils/csv-parser';

interface PreviewRow {
  rowIndex: number;
  employeeName?: string;
  employeeCode?: string;
  employeeId?: number;
  productName?: string;
  productId?: number;
  amount?: number;
  clientName?: string;
  policyNumber?: string;
  insurer?: string;
  channelPayoutPct?: number;
  fpRoute?: boolean;
  raw: string[];
  error?: string;
}

/**
 * POST /api/admin/mis/business/upload — Preview CSV upload
 * Accepts FormData: file (CSV), month (optional), employeeId (optional override)
 */
export async function POST(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email') || 'admin';

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const month = (formData.get('month') as string) || getCurrentMonth();
    const overrideEmployeeId = formData.get('employeeId')
      ? parseInt(formData.get('employeeId') as string)
      : undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Accept CSV and Excel files
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    if (!isCsv && !isExcel) {
      return NextResponse.json(
        { error: 'Only .csv, .xlsx, and .xls files are supported.' },
        { status: 400 }
      );
    }

    let headers: string[];
    let rows: string[][];

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      if (buffer.byteLength === 0) {
        return NextResponse.json({ error: 'File is empty' }, { status: 400 });
      }
      const parsed = await parseExcel(buffer);
      headers = parsed.headers;
      rows = parsed.rows;
    } else {
      const text = await file.text();
      if (!text.trim()) {
        return NextResponse.json({ error: 'File is empty' }, { status: 400 });
      }
      const parsed = parseCSV(text);
      headers = parsed.headers;
      rows = parsed.rows;
    }

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 });
    }

    // Detect format and auto-map columns
    const format = detectFormat(headers);
    const mapping = autoMapColumns(headers, format);

    // Load employees for matching
    const employees = await getEmployees({ isActive: true });

    // Build preview rows
    const preview: PreviewRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = applyMapping(row, headers, mapping);

      const previewRow: PreviewRow = {
        rowIndex: i + 2, // 1-indexed + header row
        raw: row,
        ...parsed,
      };

      // Match employee
      if (overrideEmployeeId) {
        previewRow.employeeId = overrideEmployeeId;
        const emp = employees.find(e => e.id === overrideEmployeeId);
        if (emp) previewRow.employeeName = emp.name;
      } else if (parsed.employeeCode) {
        const emp = employees.find(
          e => e.employeeCode.toLowerCase() === parsed.employeeCode!.toLowerCase()
        );
        if (emp) {
          previewRow.employeeId = emp.id;
          previewRow.employeeName = emp.name;
        }
      } else if (parsed.employeeName) {
        const emp = employees.find(
          e => e.name.toLowerCase().includes(parsed.employeeName!.toLowerCase()) ||
               parsed.employeeName!.toLowerCase().includes(e.name.toLowerCase())
        );
        if (emp) {
          previewRow.employeeId = emp.id;
          previewRow.employeeName = emp.name;
        }
      }

      // Match product
      if (parsed.productName) {
        const match = fuzzyMatchProduct(parsed.productName, PRODUCTS);
        if (match) {
          previewRow.productId = match.id;
          previewRow.productName = match.productName;
        }
      }

      // Validate
      const errors: string[] = [];
      if (!previewRow.employeeId) errors.push('Employee not matched');
      if (!previewRow.productId) errors.push('Product not matched');
      if (!previewRow.amount || previewRow.amount <= 0) errors.push('Invalid amount');

      if (errors.length > 0) {
        previewRow.error = errors.join('; ');
        invalidCount++;
      } else {
        validCount++;
      }

      preview.push(previewRow);
    }

    return NextResponse.json({
      format,
      headers,
      columnMapping: mapping,
      preview: preview.slice(0, 100), // Cap preview at 100 rows
      totalRows: rows.length,
      stats: {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      },
      month,
    });
  } catch (error) {
    console.error('CSV upload preview error:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/mis/business/upload — Execute bulk import
 * Body: { rows: PreviewRow[], month: string, columnMapping?: ColumnMapping }
 */
export async function PUT(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email') || 'admin';

    const body = await request.json();
    const { rows, month } = body as {
      rows: PreviewRow[];
      month: string;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (!row.employeeId || !row.productId || !row.amount || row.amount <= 0) {
        skipped++;
        errors.push(`Row ${row.rowIndex}: Missing required fields`);
        continue;
      }

      try {
        await createBusinessEntry(
          {
            employeeId: row.employeeId,
            month: month || getCurrentMonth(),
            productId: row.productId,
            rawAmount: row.amount,
            channelPayoutPct: row.channelPayoutPct || 0,
            isFpRoute: row.fpRoute || false,
            policyNumber: row.policyNumber,
            clientName: row.clientName,
            insurer: row.insurer,
          },
          adminEmail
        );
        imported++;
      } catch (err: unknown) {
        skipped++;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${row.rowIndex}: ${msg}`);
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.slice(0, 50), // Cap error list
    });
  } catch (error) {
    console.error('CSV bulk import error:', error);
    return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
  }
}

// ─── Helpers ───

function applyMapping(
  row: string[],
  headers: string[],
  mapping: ColumnMapping
): Partial<PreviewRow> {
  const result: Partial<PreviewRow> = {};

  for (let i = 0; i < headers.length && i < row.length; i++) {
    const field = mapping[headers[i]];
    const value = row[i]?.trim() || '';
    if (!value || field === 'ignore') continue;

    switch (field as SystemField) {
      case 'employeeName':
        result.employeeName = value;
        break;
      case 'employeeCode':
        result.employeeCode = value;
        break;
      case 'product':
        result.productName = value;
        break;
      case 'amount':
        result.amount = parseAmount(value);
        break;
      case 'clientName':
        result.clientName = value;
        break;
      case 'policyNumber':
        result.policyNumber = value;
        break;
      case 'insurer':
        result.insurer = value;
        break;
      case 'channelPayoutPct':
        result.channelPayoutPct = parseFloat(value) || 0;
        break;
      case 'fpRoute':
        result.fpRoute = value.toLowerCase() === 'yes' || value === '1' || value.toLowerCase() === 'true';
        break;
    }
  }

  return result;
}

function parseAmount(value: string): number {
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[₹$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}
