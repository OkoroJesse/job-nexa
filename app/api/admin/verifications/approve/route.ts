import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { transactionId, userId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();

      // 1. Update Transaction to Approved
      const { data: tx, error: txError } = await adminClient
        .from('payment_transactions')
        .update({
          status: 'approved',
          verified_by_admin_id: adminSession.userId === 'admin-system-root' ? null : adminSession.userId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select('user_id, amount_kobo, reference')
        .single();

      if (txError) {
        return NextResponse.json({ error: txError.message }, { status: 400 });
      }

      const targetUserId = userId || tx.user_id;

      // 2. Activate Subscription for strictly 30 days from confirmed activation
      const activatedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await adminClient.from('user_subscriptions').upsert({
        user_id: targetUserId,
        status: 'active',
        plan_name: '30-Day All-Access Pass',
        plan_price_kobo: 350000,
        activated_at: activatedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // 3. Notify User
      await adminClient.from('notifications').insert({
        user_id: targetUserId,
        title: 'Bank Transfer Payment Approved!',
        message: 'Your ₦3,500 bank transfer payment has been confirmed on our ledger. Your 30-day Pro Pass is now active.',
        type: 'payment',
        action_url: '/jobs',
      });

      // 4. Record Audit Log
      await recordAdminAuditLog(
        adminSession.userId || 'admin',
        'approve_bank_receipt',
        'payment_transactions',
        transactionId,
        {
          targetUserId,
          reference: tx.reference,
          activatedAt: activatedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bank transfer verified and approved. 30-day membership activated from now.',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Admin approval error:', error);
    return NextResponse.json({ error: 'Failed to approve transaction' }, { status: 500 });
  }
}
