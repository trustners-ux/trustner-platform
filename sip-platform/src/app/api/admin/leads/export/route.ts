import { NextResponse } from 'next/server';
import { getLeads, leadsToCSV } from '@/lib/admin/leads-store';

export async function GET() {
  try {
    const leads = await getLeads();
    const csv = leadsToCSV(leads);
    const today = new Date().toISOString().split('T')[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${today}.csv"`,
      },
    });
  } catch (err) {
    console.error('Failed to export leads:', err);
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 }
    );
  }
}
