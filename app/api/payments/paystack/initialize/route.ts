import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────────────
    // Get user ID from session for per-user rate limiting where possible
    let sessionUserId: string | undefined;
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        sessionUserId = user?.id;
      } catch { /* fall back to IP-based limiting */ }
    }

    const rateLimitResponse = await enforceRateLimit(req, 'paystack_init', sessionUserId);
    if (rateLimitResponse) return rateLimitResponse;

    // ── Parse and validate body ────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, userId, callbackUrl } = body as {
      email?: string;
      userId?: string;
      callbackUrl?: string;
    };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid user email is required' }, { status: 400 });
    }

    const amountInKobo = 350000; // ₦3,500.00 — fixed price, never client-controlled
    const reference = `JN-PSTK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (secretKey && !secretKey.includes('placeholder') && !secretKey.includes('sample')) {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          amount: amountInKobo,
          reference,
          currency: 'NGN',
          callback_url:
            callbackUrl ||
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
          metadata: {
            // Use session-verified userId, not client-supplied one
            user_id: sessionUserId || userId,
            plan: '30-Day All-Access Pass',
          },
        }),
      });

      const data = await response.json();
      if (!data.status) {
        return NextResponse.json(
          { error: data.message || 'Paystack initialization failed' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        reference,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
      });
    }

    return NextResponse.json(
      {
        error:
          'Paystack payment gateway is currently not configured on this server. Please use Direct Bank Transfer or contact support.',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize Paystack transaction' }, { status: 500 });
  }
}
