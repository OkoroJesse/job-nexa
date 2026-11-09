import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';

const MAX_FIELD_LENGTH = 100;

function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

function containsPathTraversal(str: string): boolean {
  return str.includes('..') || str.includes('/etc/') || str.includes('\\\\');
}

export async function POST(req: NextRequest) {
  try {
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    // ── Authentication check ───────────────────────────────────────────────
    let authenticatedUserId: string | null = null;
    if (isConfigured) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required. Please log in to submit a payment receipt.' },
            { status: 401 }
          );
        }
        authenticatedUserId = user.id;
      } catch {
        return NextResponse.json(
          { error: 'Authentication check failed. Please log in again.' },
          { status: 401 }
        );
      }
    }

    // ── Rate limiting (per authenticated user, or IP in demo mode) ─────────
    const rateLimitResponse = await enforceRateLimit(
      req,
      'bank_transfer',
      authenticatedUserId || undefined
    );
    if (rateLimitResponse) return rateLimitResponse;

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userId, senderBank, senderName, transferDate, receiptPath } = body as {
      userId?: string;
      senderBank?: string;
      senderName?: string;
      transferDate?: string;
      receiptPath?: string;
    };

    // ── Input validation ───────────────────────────────────────────────────
    if (!senderBank || typeof senderBank !== 'string' || senderBank.trim().length === 0) {
      return NextResponse.json({ error: 'Sender bank name is required' }, { status: 400 });
    }
    if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
      return NextResponse.json({ error: 'Sender account name is required' }, { status: 400 });
    }
    if (senderBank.trim().length > MAX_FIELD_LENGTH) {
      return NextResponse.json(
        { error: `Sender bank name must not exceed ${MAX_FIELD_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (senderName.trim().length > MAX_FIELD_LENGTH) {
      return NextResponse.json(
        { error: `Sender account name must not exceed ${MAX_FIELD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const cleanDate =
      transferDate && typeof transferDate === 'string'
        ? transferDate.trim()
        : new Date().toISOString().split('T')[0];

    if (transferDate && !isValidDateString(cleanDate)) {
      return NextResponse.json(
        { error: 'Invalid transfer date. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    const dateObj = new Date(cleanDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateObj > tomorrow) {
      return NextResponse.json({ error: 'Transfer date cannot be in the future.' }, { status: 400 });
    }

    if (receiptPath && typeof receiptPath === 'string' && containsPathTraversal(receiptPath)) {
      return NextResponse.json({ error: 'Invalid receipt path' }, { status: 400 });
    }

    // ── SECURITY: Use authenticated session user ID, not client-supplied ───
    const targetUserId = isConfigured
      ? authenticatedUserId
      : (userId as string | undefined) ?? null;

    const reference = `JN-BT-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    if (isConfigured && targetUserId) {
      const adminClient = createAdminClient();

      // STRICT INVARIANT: Insert ONLY with status 'pending_verification'.
      // The user_subscriptions table is NEVER touched here.
      // Only an admin calling /api/admin/verifications/approve may activate membership.
      const { error: insertError } = await adminClient.from('payment_transactions').insert({
        user_id: targetUserId,
        amount_kobo: 350000,
        currency: 'NGN',
        channel: 'bank_transfer',
        status: 'pending_verification',
        reference,
        sender_bank_name: senderBank.trim().substring(0, MAX_FIELD_LENGTH),
        sender_account_name: senderName.trim().substring(0, MAX_FIELD_LENGTH),
        transfer_date: cleanDate,
        receipt_storage_path: receiptPath ? (receiptPath as string).substring(0, 500) : null,
      });

      if (insertError) {
        console.error('Bank transfer insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to record bank transfer submission' },
          { status: 500 }
        );
      }

      // Notify admin team
      await adminClient.from('notifications').insert({
        user_id: null,
        title: 'New Bank Transfer Receipt Submitted',
        message: `${senderName.trim()} submitted a ₦3,500 bank transfer receipt from ${senderBank.trim()}. Awaiting credit audit before any activation.`,
        type: 'payment',
        action_url: '/admin/verifications',
      });
    }

    return NextResponse.json({
      success: true,
      reference,
      status: 'pending_verification',
      message:
        'Receipt submitted. Status: Pending Verification. An administrator will verify actual bank credit before any membership activation. This may take 1–2 business days.',
    });
  } catch (error) {
    console.error('Bank transfer submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit bank transfer information' },
      { status: 500 }
    );
  }
}
