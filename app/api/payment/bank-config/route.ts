import { NextRequest, NextResponse } from 'next/server';
import { createPublicServerClient } from '@/lib/supabase/server';

/**
 * GET /api/payment/bank-config
 * Public endpoint that returns the platform's bank transfer configuration.
 * Returns only the display fields — never sensitive admin data.
 * Returns { is_enabled: false } when no bank account has been configured.
 */
export async function GET(req: NextRequest) {
  try {
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      // Demo mode — bank transfer is not available until configured
      return NextResponse.json({
        is_enabled: false,
        bank_name: null,
        account_number: null,
        account_name: null,
        transfer_instructions: null,
        demo_mode: true,
      });
    }

    const supabase = createPublicServerClient();

    // The RLS policy allows authenticated users to read when is_enabled = true.
    // We use the service role here (via createPublicServerClient with anon key)
    // which still respects RLS — so only enabled configs are returned.
    const { data, error } = await supabase
      .from('bank_account_config')
      .select('bank_name, account_number, account_name, transfer_instructions, is_enabled')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ is_enabled: false });
    }

    if (!data.is_enabled) {
      return NextResponse.json({ is_enabled: false });
    }

    return NextResponse.json(
      {
        is_enabled: true,
        bank_name: data.bank_name,
        account_number: data.account_number,
        account_name: data.account_name,
        transfer_instructions: data.transfer_instructions,
      },
      {
        headers: {
          // Cache for 5 minutes — settings don't change frequently
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('Bank config GET error:', err);
    return NextResponse.json({ is_enabled: false }, { status: 200 });
  }
}
