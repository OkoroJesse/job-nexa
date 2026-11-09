import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('payment_transactions')
      .select(`
        id, user_id, amount_kobo, currency, channel, status, reference,
        sender_bank_name, sender_account_name, verified_at, created_at,
        profile:profiles(id, email, full_name)
      `)
      .eq('channel', 'paystack')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (err: any) {
    console.error('Admin paystack transactions error:', err);
    return NextResponse.json({ error: 'Failed to fetch Paystack transactions' }, { status: 500 });
  }
}
