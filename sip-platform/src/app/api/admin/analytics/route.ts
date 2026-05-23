import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { getAnalytics } from '@/lib/services/analytics-store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Parse days param (default 30)
  const { searchParams } = new URL(req.url);
  const days = Math.min(Number(searchParams.get('days') || '30'), 90);

  try {
    const data = await getAnalytics(days);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
