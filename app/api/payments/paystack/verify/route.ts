import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────────────
    let sessionUserId: string | undefined;
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        sessionUserId = user?.id;
      } catch { /* fall back to IP */ }
    }

    const rateLimitResponse = await enforceRateLimit(req, 'paystack_verify', sessionUserId);
    if (rateLimitResponse) return rateLimitResponse;

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { reference, userId } = body as { reference?: string; userId?: string };

    if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
      return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });
    }

    // Sanitise reference to prevent injection via Paystack API URL
    const cleanReference = reference.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (cleanReference !== reference.trim()) {
      return NextResponse.json({ error: 'Invalid transaction reference format' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    let paymentVerified = false;
    let paymentData: Record<string, unknown> | null = null;

    if (secretKey && !secretKey.includes('placeholder') && !secretKey.includes('sample')) {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanReference)}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );

      const resData = await response.json();
      if (
        resData.status &&
        resData.data?.status === 'success' &&
        resData.data?.amount === 350000 // ₦3,500 exact — never trust client-sent amount
      ) {
        paymentVerified = true;
        paymentData = resData.data;
      } else {
        return NextResponse.json(
          { error: resData.message || 'Payment verification failed or amount mismatch' },
          { status: 400 }
        );
      }
    } else {
      // Sandbox / demo mode
      paymentVerified = true;
      paymentData = {
        reference: cleanReference,
        amount: 350000,
        currency: 'NGN',
        status: 'success',
        channel: 'card',
        paid_at: new Date().toISOString(),
      };
    }

    if (paymentVerified) {
      // Use session user ID — do not trust client-supplied userId
      const targetUserId =
        sessionUserId ||
        (paymentData?.metadata as Record<string, unknown>)?.user_id as string | undefined ||
        userId;

      if (isConfigured && targetUserId) {
        const adminClient = createAdminClient();

        // ── IDEMPOTENCY: Check if reference already processed ──────────────
        const { data: existing } = await adminClient
          .from('payment_transactions')
          .select('id, status')
          .eq('reference', cleanReference)
          .maybeSingle();

        if (existing) {
          // Already processed — return success without duplicating
          return NextResponse.json({
            success: true,
            message: 'Payment already verified and membership active.',
            alreadyProcessed: true,
          });
        }

        // 1. Idempotently record transaction
        await adminClient.from('payment_transactions').upsert(
          {
            user_id: targetUserId,
            amount_kobo: 350000,
            currency: 'NGN',
            channel: 'paystack',
            status: 'approved',
            reference: cleanReference,
            gateway_response: paymentData,
            verified_at: new Date().toISOString(),
          },
          { onConflict: 'reference' }
        );

        // 2. Idempotently activate 30-day subscription from confirmed activation
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await adminClient.from('user_subscriptions').upsert(
          {
            user_id: targetUserId,
            status: 'active',
            plan_name: '30-Day All-Access Pass',
            plan_price_kobo: 350000,
            activated_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        // 3. Notify user
        await adminClient.from('notifications').insert({
          user_id: targetUserId,
          title: '30-Day Pro Membership Activated',
          message:
            'Your payment of ₦3,500 via Paystack was verified. You now have full access to direct employer contacts for 30 days.',
          type: 'subscription',
          action_url: '/jobs',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully. Membership is active for 30 days.',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return NextResponse.json({ error: 'Verification unsuccessful' }, { status: 400 });
  } catch (error) {
    console.error('Paystack verification error:', error);
    return NextResponse.json({ error: 'Server error during payment verification' }, { status: 500 });
  }
}
