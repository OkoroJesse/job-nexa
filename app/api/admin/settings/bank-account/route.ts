import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';

export interface BankAccountConfig {
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  transfer_instructions: string | null;
  is_enabled: boolean;
}

/**
 * GET /api/admin/settings/bank-account
 * Returns the current bank account configuration.
 * Admin-only.
 */
export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      // Demo mode — return unconfigured state
      return NextResponse.json({
        bank_name: null,
        account_number: null,
        account_name: null,
        transfer_instructions: null,
        is_enabled: false,
        demo_mode: true,
      });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('bank_account_config')
      .select('bank_name, account_number, account_name, transfer_instructions, is_enabled')
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Bank account config GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch bank account configuration' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings/bank-account
 * Update the owner's bank account configuration.
 * Super admin / admin only. Writes audit log.
 */
export async function PATCH(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only super_admin and admin can change payment settings
    if (!['super_admin', 'admin'].includes(adminSession.role || '')) {
      return NextResponse.json(
        { error: 'Forbidden: Only super administrators and admins may update payment settings.' },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { bank_name, account_number, account_name, transfer_instructions, is_enabled } = body as {
      bank_name?: string;
      account_number?: string;
      account_name?: string;
      transfer_instructions?: string;
      is_enabled?: boolean;
    };

    // Validate fields
    if (bank_name !== undefined && typeof bank_name !== 'string') {
      return NextResponse.json({ error: 'bank_name must be a string' }, { status: 400 });
    }
    if (account_number !== undefined && typeof account_number !== 'string') {
      return NextResponse.json({ error: 'account_number must be a string' }, { status: 400 });
    }
    if (account_name !== undefined && typeof account_name !== 'string') {
      return NextResponse.json({ error: 'account_name must be a string' }, { status: 400 });
    }
    if (is_enabled !== undefined && typeof is_enabled !== 'boolean') {
      return NextResponse.json({ error: 'is_enabled must be a boolean' }, { status: 400 });
    }

    // Length limits
    if (bank_name && bank_name.trim().length > 100) {
      return NextResponse.json({ error: 'bank_name must not exceed 100 characters' }, { status: 400 });
    }
    if (account_number && account_number.trim().length > 20) {
      return NextResponse.json({ error: 'account_number must not exceed 20 characters' }, { status: 400 });
    }
    if (account_name && account_name.trim().length > 100) {
      return NextResponse.json({ error: 'account_name must not exceed 100 characters' }, { status: 400 });
    }

    // Validate account number is digits only (Nigerian bank account numbers are 10 digits)
    if (account_number !== undefined && account_number.trim().length > 0) {
      if (!/^\d{10}$/.test(account_number.trim())) {
        return NextResponse.json(
          { error: 'Nigerian bank account numbers must be exactly 10 digits' },
          { status: 400 }
        );
      }
    }

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode: Settings saved locally (configure Supabase to persist)',
        demo_mode: true,
      });
    }

    const adminClient = createAdminClient();

    // Build update payload — only include provided fields
    const updatePayload: Record<string, unknown> = {
      updated_by: adminSession.userId !== 'admin-system-root' ? adminSession.userId : null,
      updated_at: new Date().toISOString(),
    };

    if (bank_name !== undefined) updatePayload.bank_name = bank_name.trim() || null;
    if (account_number !== undefined) updatePayload.account_number = account_number.trim() || null;
    if (account_name !== undefined) updatePayload.account_name = account_name.trim() || null;
    if (transfer_instructions !== undefined) {
      updatePayload.transfer_instructions = transfer_instructions.trim() || null;
    }
    if (is_enabled !== undefined) {
      // If enabling, require all fields to be present
      if (is_enabled) {
        const { data: current } = await adminClient
          .from('bank_account_config')
          .select('bank_name, account_number, account_name')
          .limit(1)
          .single();

        const finalBankName = (bank_name ?? current?.bank_name ?? '').trim();
        const finalAccountNumber = (account_number ?? current?.account_number ?? '').trim();
        const finalAccountName = (account_name ?? current?.account_name ?? '').trim();

        if (!finalBankName || !finalAccountNumber || !finalAccountName) {
          return NextResponse.json(
            {
              error:
                'Cannot enable bank transfer without a complete bank account configuration. ' +
                'Please provide bank_name, account_number, and account_name.',
            },
            { status: 400 }
          );
        }
      }
      updatePayload.is_enabled = is_enabled;
    }

    const { data, error } = await adminClient
      .from('bank_account_config')
      .update(updatePayload)
      .eq('is_enabled', updatePayload.is_enabled ?? (await adminClient
        .from('bank_account_config')
        .select('is_enabled')
        .limit(1)
        .single()).data?.is_enabled ?? false)
      .select('bank_name, account_number, account_name, transfer_instructions, is_enabled')
      .maybeSingle();

    // If upsert needed (first time)
    let finalData = data;
    if (!finalData) {
      const { data: upserted } = await adminClient
        .from('bank_account_config')
        .upsert({
          ...updatePayload,
          configured_by: adminSession.userId !== 'admin-system-root' ? adminSession.userId : null,
          configured_at: new Date().toISOString(),
        })
        .select('bank_name, account_number, account_name, transfer_instructions, is_enabled')
        .single();
      finalData = upserted;
    }

    if (error) {
      console.error('Bank config update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Write audit log
    await recordAdminAuditLog(
      adminSession.userId || 'admin',
      'update_bank_account_config',
      'bank_account_config',
      'singleton',
      {
        updatedFields: Object.keys(body),
        is_enabled: updatePayload.is_enabled,
        updatedBy: adminSession.email,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Bank account configuration updated successfully.',
      config: finalData,
    });
  } catch (err) {
    console.error('Bank account config PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update bank account configuration' }, { status: 500 });
  }
}
