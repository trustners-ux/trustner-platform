import { NextResponse } from 'next/server';
import { updateLeadStatus } from '@/lib/admin/leads-store';
import type { LeadStatus } from '@/lib/admin/leads-store';

const VALID_STATUSES: LeadStatus[] = ['new', 'contacted', 'follow-up', 'converted', 'archived'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = (await request.json()) as { status: LeadStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + VALID_STATUSES.join(', ') },
        { status: 400 }
      );
    }

    const updated = await updateLeadStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead: updated });
  } catch (err) {
    console.error('Failed to update lead:', err);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
