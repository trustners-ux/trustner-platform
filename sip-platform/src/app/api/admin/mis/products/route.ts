import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/dal/products';
import { createChangeRequest } from '@/lib/admin/change-request-store';
import { findUserByEmail } from '@/lib/auth/config';

// ─── GET: Return all products ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined;

    const products = await getProducts({ category, isActive });

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error('[Products API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// ─── POST: Create a change request for product modification ───
export async function POST(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Missing x-admin-email header' },
        { status: 401 }
      );
    }

    const user = findUserByEmail(adminEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized — unknown admin user' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, id, product, updates, title, description, previousData } = body;

    if (!action || !['insert', 'update', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "insert", "update", or "delete"' },
        { status: 400 }
      );
    }

    if (action === 'update' && (!id || !updates)) {
      return NextResponse.json(
        { error: 'Update action requires id and updates' },
        { status: 400 }
      );
    }

    if (action === 'insert' && !product) {
      return NextResponse.json(
        { error: 'Insert action requires product data' },
        { status: 400 }
      );
    }

    if (action === 'delete' && !id) {
      return NextResponse.json(
        { error: 'Delete action requires id' },
        { status: 400 }
      );
    }

    // Build change data
    const changeData: Record<string, unknown> = { action };
    if (id) changeData.id = id;
    if (product) changeData.product = product;
    if (updates) changeData.updates = updates;

    const entry = await createChangeRequest({
      type: 'product_rule',
      title: title || `Product ${action}`,
      description: description || `Request to ${action} product`,
      requestedBy: adminEmail,
      requestedByName: user.name,
      changeData,
      previousData: previousData || null,
    });

    console.log(`[Products API] Created change request ${entry.id} for product ${action} by ${adminEmail}`);
    return NextResponse.json({ success: true, approval: entry }, { status: 201 });
  } catch (error) {
    console.error('[Products API] Create change request error:', error);
    return NextResponse.json(
      { error: `Failed to create product change request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
