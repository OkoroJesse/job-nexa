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

    // Use admin client with service role to read public display fields safely.
    // Bank account receiving details are intended for public customer display when is_enabled = true.
    // We only select the non-sensitive public display fields: bank_name, account_number, account_name, transfer_instructions.
    const adminClient = (await import('@/lib/supabase/admin')).createAdminClient();

    const { data, error } = await adminClient
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
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Bank config GET error:', err);
    return NextResponse.json({ is_enabled: false }, { status: 200 });
  }
}
