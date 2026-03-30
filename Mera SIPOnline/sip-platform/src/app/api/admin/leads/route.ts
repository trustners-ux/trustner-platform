import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/admin/leads-store';
import type { LeadStatus } from '@/lib/admin/leads-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as LeadStatus | null;
    const search = searchParams.get('search')?.toLowerCase();
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let leads = await getLeads();

    // Filter by status
    if (status) {
      leads = leads.filter((l) => l.status === status);
    }

    // Filter by search (name, phone, email)
    if (search) {
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.phone.includes(search) ||
          (l.email && l.email.toLowerCase().includes(search))
      );
    }

    // Filter by date range
    if (from) {
      const fromDate = new Date(from);
      leads = leads.filter((l) => new Date(l.createdAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      leads = leads.filter((l) => new Date(l.createdAt) <= toDate);
    }

    return NextResponse.json({ leads, total: leads.length });
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
