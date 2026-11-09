import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const adminClient = createAdminClient();
    let query = adminClient
      .from('payment_transactions')
      .select(`
        id, user_id, amount_kobo, currency, channel, status, reference,
        receipt_storage_path, sender_bank_name, sender_account_name,
        transfer_date, verified_by_admin_id, verified_at, rejection_reason,
        created_at,
        profile:profiles(id, email, full_name, phone_number)
      `)
      .eq('channel', 'bank_transfer')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (err: any) {
    console.error('Admin verifications error:', err);
    return NextResponse.json({ error: 'Failed to fetch verification transactions' }, { status: 500 });
  }
}
