import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { transactionId, rejectionReason } = await req.json();

    if (!transactionId || !rejectionReason) {
      return NextResponse.json({ error: 'Transaction ID and rejection reason are required' }, { status: 400 });
    }

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();

      const { data: tx, error: txError } = await adminClient
        .from('payment_transactions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          verified_by_admin_id: adminSession.userId === 'admin-system-root' ? null : adminSession.userId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select('user_id, reference')
        .single();

      if (txError) {
        return NextResponse.json({ error: txError.message }, { status: 400 });
      }

      // Notify User
      await adminClient.from('notifications').insert({
        user_id: tx.user_id,
        title: 'Payment Verification Update',
        message: `Your bank transfer receipt (Ref: ${tx.reference}) was reviewed and rejected. Reason: ${rejectionReason}`,
        type: 'payment',
        action_url: '/pricing',
      });

      // Record Audit Log
      await recordAdminAuditLog(
        adminSession.userId || 'admin',
        'reject_bank_receipt',
        'payment_transactions',
        transactionId,
        {
          targetUserId: tx.user_id,
          reference: tx.reference,
          rejectionReason,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction rejected successfully. User notified with reason.',
    });
  } catch (error) {
    console.error('Admin rejection error:', error);
    return NextResponse.json({ error: 'Failed to reject transaction' }, { status: 500 });
  }
}
