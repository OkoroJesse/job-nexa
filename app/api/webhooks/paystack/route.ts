import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting for webhook (high limit — Paystack retries aggressively) ─
    // We use IP-based limiting only. Paystack IPs are known but we limit per-IP
    // to prevent spoofed webhook floods while allowing genuine retries.
    const webhookRateLimit = await enforceRateLimit(req, 'webhook_paystack');
    if (webhookRateLimit) {
      // For webhooks, return 429 so Paystack will retry later (not 401)
      console.warn('[Webhook] Rate limit exceeded for Paystack webhook');
      return webhookRateLimit;
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    // Check if secret key is configured
    if (!secretKey || secretKey.includes('placeholder')) {
      console.warn(
        'Paystack secret key is placeholder or missing. Webhook received in simulation mode.'
      );
      return NextResponse.json({ received: true, simulated: true });
    }

    // Reject immediately if signature header is missing
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-paystack-signature header' },
        { status: 401 }
      );
    }

    // Verify HMAC SHA-512 using timing-safe comparison to prevent timing attacks
    const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');

    let signaturesMatch = false;
    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const hashBuffer = Buffer.from(hash, 'hex');
      signaturesMatch =
        sigBuffer.length === hashBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, hashBuffer);
    } catch {
      signaturesMatch = false;
    }

    if (!signaturesMatch) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Parse payload
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (event.event === 'charge.success') {
      const data = event.data as Record<string, unknown>;
      const amount = data.amount as number;
      const metadata = (data.metadata || {}) as Record<string, unknown>;
      const userId = metadata.user_id as string | undefined;
      const reference = data.reference as string;

      if (!reference || typeof reference !== 'string') {
        return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
      }

      // Ensure amount is exactly ₦3,500 (350000 kobo) and userId present
      if (amount === 350000 && userId && typeof userId === 'string') {
        const supabase = createAdminClient();

        // ── IDEMPOTENCY: Reject duplicate webhook events ───────────────────────
        const { data: existing } = await supabase
          .from('payment_transactions')
          .select('id, status')
          .eq('reference', reference)
          .maybeSingle();

        if (existing) {
          console.info(
            `[Webhook] Duplicate event for reference ${reference} — already processed, returning 200`
          );
          return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        // 1. Record approved transaction
        const { error: txError } = await supabase.from('payment_transactions').insert({
          user_id: userId,
          amount_kobo: amount,
          currency: 'NGN',
          channel: 'paystack',
          status: 'approved',
          reference,
          gateway_response: data,
          verified_by_admin_id: null,
          verified_at: new Date().toISOString(),
        });

        if (txError) {
          console.error('[Webhook] Failed to insert transaction:', txError);
          // Return 500 so Paystack will retry
          return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
        }

        // 2. Activate or extend 30-day subscription
        const activatedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await supabase.from('user_subscriptions').upsert(
          {
            user_id: userId,
            status: 'active',
            plan_name: '30-Day All-Access Pass',
            plan_price_kobo: 350000,
            activated_at: activatedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        // 3. Notify user
        await supabase.from('notifications').insert({
          user_id: userId,
          title: '30-Day Pro Membership Activated',
          message:
            'Your payment of ₦3,500 via Paystack was verified. You now have full access to direct employer contacts for 30 days.',
          type: 'subscription',
          action_url: '/jobs',
        });
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
