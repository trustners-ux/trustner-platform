import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getAdminUsersFromBlob,
  addAdminUser,
  deleteAdminUser,
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
} from '@/lib/admin/admin-user-store';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');

// Validate an admin action token
async function validateActionToken(
  token: string,
  expectedAction: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== 'admin-action') {
      return { valid: false, error: 'Invalid token type' };
    }
    if (payload.action !== expectedAction) {
      return { valid: false, error: `Token is for "${payload.action}" not "${expectedAction}"` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Token expired or invalid. Please verify OTP again.' };
  }
}

// ─── GET: List all admin users (excludes passwordHash) ───
export async function GET(request: Request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await getAdminUsersFromBlob();

    // Strip sensitive data, flag super admin
    const safeUsers = users.map(({ email, name, role }) => ({
      email,
      name,
      role,
      isSuperAdmin: isSuperAdmin(email),
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('[Admin Users] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// ─── POST: Add new user (requires OTP action token) ───
export async function POST(request: Request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, role, password, actionToken } = await request.json();

    // Validate action token
    if (!actionToken) {
      return NextResponse.json(
        { error: 'OTP verification required' },
        { status: 403 }
      );
    }

    const tokenResult = await validateActionToken(actionToken, 'add');
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: 'Email, name, role, and password are required' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be admin, editor, or viewer' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Add user
    await addAdminUser({ email, name, password, role });

    // Send welcome email
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Mera SIP Online <noreply@merasip.com>',
            to: email,
            subject: 'Welcome to Trustner Admin Panel',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1E3A5F, #0F2B47); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h2 style="color: #fff; margin: 0; font-size: 20px;">Trustner Admin</h2>
                  <p style="color: #93C5FD; margin: 6px 0 0; font-size: 13px;">Welcome aboard!</p>
                </div>
                <div style="background: #fff; padding: 30px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">Hi ${name},</p>
                  <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
                    You have been added as <strong>${role}</strong> to the Mera SIP Online admin panel.
                  </p>
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
                    <p style="color: #64748B; font-size: 13px; margin: 0 0 8px;"><strong>Login URL:</strong></p>
                    <a href="https://www.merasip.com/admin/login" style="color: #1E3A5F; font-size: 14px; font-weight: 600;">www.merasip.com/admin/login</a>
                    <p style="color: #64748B; font-size: 13px; margin: 12px 0 4px;"><strong>Email:</strong> ${email}</p>
                    <p style="color: #64748B; font-size: 13px; margin: 0;"><strong>Temporary Password:</strong> ${password}</p>
                  </div>
                  <p style="color: #EF4444; font-size: 13px; font-weight: 600; margin: 0 0 8px;">
                    Please change your password after first login.
                  </p>
                  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0 16px;" />
                  <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">
                    Trustner Asset Services Pvt. Ltd. | ARN-286886
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[Admin Users] Welcome email failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} added successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add user';
    console.error('[Admin Users] POST error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ─── DELETE: Remove user (requires OTP action token) ───
export async function DELETE(request: Request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, actionToken } = await request.json();

    // Validate action token
    if (!actionToken) {
      return NextResponse.json(
        { error: 'OTP verification required' },
        { status: 403 }
      );
    }

    const tokenResult = await validateActionToken(actionToken, 'delete');
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Hard-block: super admin cannot be deleted
    if (isSuperAdmin(email)) {
      return NextResponse.json(
        { error: 'Super Admin account cannot be deleted. This action is permanently blocked.' },
        { status: 403 }
      );
    }

    // Delete user
    await deleteAdminUser(email, adminEmail);

    // Send notification email to deleted user
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Mera SIP Online <noreply@merasip.com>',
            to: email,
            subject: 'Trustner Admin Access Removed',
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="background: #fff; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
                  <p style="color: #334155; font-size: 15px; margin: 0 0 12px;">Your admin access to the Mera SIP Online panel has been removed.</p>
                  <p style="color: #64748B; font-size: 13px; margin: 0;">If you believe this was done in error, please contact the team at wecare@merasip.com.</p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[Admin Users] Removal notification failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} removed successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    console.error('[Admin Users] DELETE error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
