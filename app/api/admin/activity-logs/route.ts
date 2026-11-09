import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      return NextResponse.json({ logs: [] });
    }

    const adminClient = createAdminClient();
    const { data: logs, error } = await adminClient
      .from('admin_audit_logs')
      .select(`
        id, action, target_table, target_id, new_state, ip_address, created_at,
        admin:profiles!admin_audit_logs_admin_id_fkey(id, full_name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    // If join fails (e.g. FK relation name), fallback to flat query
    if (error) {
      const { data: flatLogs } = await adminClient
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      return NextResponse.json({ logs: flatLogs || [] });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
