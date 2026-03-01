import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LeadRecord, LeadsResponse } from '@/types/api'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY

// GET /api/admin/leads — List leads with pagination
export async function GET(request: Request) {
  try {
    // Authenticate via Bearer token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    if (!ADMIN_API_KEY || token !== ADMIN_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    )
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    // Get total count
    const { count, error: countError } = await supabase
      .from('leads_view')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Leads count error:', countError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads count' },
        { status: 500 }
      )
    }

    // Fetch paginated leads
    const { data: leads, error: fetchError } = await supabase
      .from('leads_view')
      .select('*')
      .order('signup_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Leads fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    const response: { success: true; data: LeadsResponse } = {
      success: true,
      data: {
        leads: (leads || []) as LeadRecord[],
        total: count ?? 0,
        page,
        limit,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/admin/leads error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
