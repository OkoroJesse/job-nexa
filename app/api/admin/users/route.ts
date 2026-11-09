import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data: users, error } = await adminClient
        .from('profiles')
        .select(`
          id, email, full_name, phone_number, role, created_at,
          subscription:user_subscriptions(id, status, plan_name, activated_at, expires_at)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ users: users || [] });
    }

    return NextResponse.json({ users: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, role, action, durationDays = 30 } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();

      if (role) {
        await adminClient.from('profiles').update({ role }).eq('id', userId);
        await recordAdminAuditLog(adminSession.userId || 'admin', 'update_user_role', 'profiles', userId, { role });
      }

      if (action === 'grant_subscription') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        await adminClient.from('user_subscriptions').upsert({
          user_id: userId,
          status: 'active',
          plan_name: `Manual Grant (${durationDays} Days)`,
          plan_price_kobo: 350000,
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await recordAdminAuditLog(adminSession.userId || 'admin', 'manual_grant_subscription', 'user_subscriptions', userId, { durationDays, expiresAt });
      } else if (action === 'revoke_subscription') {
        await adminClient.from('user_subscriptions').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        await recordAdminAuditLog(adminSession.userId || 'admin', 'revoke_subscription', 'user_subscriptions', userId, { status: 'cancelled' });
      }
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
