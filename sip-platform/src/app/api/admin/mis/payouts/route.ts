import { NextRequest, NextResponse } from 'next/server';
import { createChangeRequest } from '@/lib/admin/change-request-store';
import { findUserByEmail, isSuperAdmin } from '@/lib/auth/config';
import {
  POSP_CATEGORIES,
  DEFAULT_CHANNEL_RULES,
  DEFAULT_POSP_GRID,
  ALL_POSP_CATEGORIES,
} from '@/lib/mis/types';
import type {
  POSPCategoryConfig,
  ChannelPayoutRule,
  POSPPayoutGrid,
} from '@/lib/mis/types';

// ─── In-memory store (seed data — will migrate to Supabase) ───
let categoryConfigs: POSPCategoryConfig[] = [...POSP_CATEGORIES];
let channelRules: ChannelPayoutRule[] = [...DEFAULT_CHANNEL_RULES];
let payoutGrid: POSPPayoutGrid[] = [...DEFAULT_POSP_GRID];

// ─── GET: Return all payout data ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section'); // 'categories' | 'channels' | 'grid' | null (all)

    if (section === 'categories') {
      return NextResponse.json({ categories: categoryConfigs });
    }
    if (section === 'channels') {
      return NextResponse.json({ channels: channelRules });
    }
    if (section === 'grid') {
      const vehicleType = searchParams.get('vehicleType');
      const region = searchParams.get('region');
      const insurer = searchParams.get('insurer');

      let filtered = payoutGrid.filter((g) => g.isActive);
      if (vehicleType) filtered = filtered.filter((g) => g.vehicleType === vehicleType);
      if (region) filtered = filtered.filter((g) => g.region === region);
      if (insurer) filtered = filtered.filter((g) => g.insurer === insurer);

      return NextResponse.json({ grid: filtered, allCategories: ALL_POSP_CATEGORIES });
    }

    return NextResponse.json({
      categories: categoryConfigs,
      channels: channelRules,
      grid: payoutGrid,
      allCategories: ALL_POSP_CATEGORIES,
    });
  } catch (error) {
    console.error('[Payouts API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payout data' }, { status: 500 });
  }
}

// ─── POST: Create/update payout data ───
export async function POST(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Missing x-admin-email header' }, { status: 401 });
    }

    const user = findUserByEmail(adminEmail);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized \u2014 unknown admin user' }, { status: 403 });
    }

    const body = await request.json();
    const { action, section, data, title, description, previousData } = body;

    // action: 'update_category' | 'update_channel' | 'update_grid_rate' | 'add_product_line'
    if (!action || !section) {
      return NextResponse.json({ error: 'Missing action or section' }, { status: 400 });
    }

    // Super Admin can edit directly; Admin creates change request
    if (isSuperAdmin(adminEmail)) {
      // Direct mutation
      const result = applyDirectChange(action, section, data);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      console.log(`[Payouts API] Direct ${action} by Super Admin ${adminEmail}`);
      return NextResponse.json({ success: true, message: `${action} applied directly`, data: result.data });
    }

    // Non-super-admin: create change request
    const changeData: Record<string, unknown> = { action, section, data };
    const entry = await createChangeRequest({
      type: 'payout_rule',
      title: title || `Payout ${action} request`,
      description: description || `Request to ${action} in ${section}`,
      requestedBy: adminEmail,
      requestedByName: user.name,
      changeData,
      previousData: previousData || null,
    });

    console.log(`[Payouts API] Created change request ${entry.id} for ${action} by ${adminEmail}`);
    return NextResponse.json({ success: true, approval: entry }, { status: 201 });
  } catch (error) {
    console.error('[Payouts API] POST error:', error);
    return NextResponse.json(
      { error: `Failed to process payout change: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// ─── Apply direct changes (Super Admin only) ───
function applyDirectChange(
  action: string,
  section: string,
  data: Record<string, unknown>
): { success: boolean; error?: string; data?: unknown } {
  try {
    switch (action) {
      case 'update_category': {
        const category = data.category as string;
        const idx = categoryConfigs.findIndex((c) => c.category === category);
        if (idx === -1) return { success: false, error: `Category ${category} not found` };
        categoryConfigs[idx] = { ...categoryConfigs[idx], ...data.updates as Partial<POSPCategoryConfig> };
        return { success: true, data: categoryConfigs[idx] };
      }

      case 'update_channel': {
        const id = data.id as number;
        const idx = channelRules.findIndex((c) => c.id === id);
        if (idx === -1) return { success: false, error: `Channel rule ${id} not found` };
        channelRules[idx] = { ...channelRules[idx], ...data.updates as Partial<ChannelPayoutRule> };
        return { success: true, data: channelRules[idx] };
      }

      case 'update_grid_rate': {
        const gridId = data.id as number;
        const idx = payoutGrid.findIndex((g) => g.id === gridId);
        if (idx === -1) return { success: false, error: `Grid entry ${gridId} not found` };
        payoutGrid[idx] = { ...payoutGrid[idx], ...data.updates as Partial<POSPPayoutGrid> };
        return { success: true, data: payoutGrid[idx] };
      }

      case 'add_product_line': {
        const newEntries = data.entries as POSPPayoutGrid[];
        if (!newEntries || newEntries.length === 0) return { success: false, error: 'No entries provided' };
        const maxId = payoutGrid.reduce((max, g) => Math.max(max, g.id), 0);
        const withIds = newEntries.map((e, i) => ({ ...e, id: maxId + i + 1 }));
        payoutGrid.push(...withIds);
        return { success: true, data: withIds };
      }

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
