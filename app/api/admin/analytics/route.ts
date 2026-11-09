import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      return NextResponse.json({
        totalPassesSold: 0,
        grossRevenueNaira: 0,
        paystackPercent: 0,
        bankTransferPercent: 0,
        activeSubscribers: 0,
        stateDistribution: [],
        verticalDistribution: [],
      });
    }

    const adminClient = createAdminClient();

    // 1. Successful payment transactions
    const { data: transactions } = await adminClient
      .from('payment_transactions')
      .select('amount_kobo, channel, status')
      .eq('status', 'success');

    let totalPassesSold = 0;
    let grossRevenueKobo = 0;
    let paystackCount = 0;
    let bankTransferCount = 0;

    if (transactions) {
      totalPassesSold = transactions.length;
      for (const t of transactions) {
        grossRevenueKobo += t.amount_kobo || 0;
        if (t.channel === 'paystack') paystackCount++;
        if (t.channel === 'bank_transfer') bankTransferCount++;
      }
    }

    const totalChannels = paystackCount + bankTransferCount;
    const paystackPercent = totalChannels > 0 ? Math.round((paystackCount / totalChannels) * 100) : 0;
    const bankTransferPercent = totalChannels > 0 ? 100 - paystackPercent : 0;
    const grossRevenueNaira = Math.round(grossRevenueKobo / 100);

    // 2. Active subscriptions count
    const { count: activeSubscribers } = await adminClient
      .from('user_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // 3. Opportunities vertical breakdown
    const { data: opps } = await adminClient
      .from('opportunities')
      .select('opportunity_type, state_id, state:locations_states(name)');

    const verticalCounts: Record<string, number> = {};
    const stateCounts: Record<string, number> = {};

    if (opps) {
      for (const o of opps) {
        const type = o.opportunity_type || 'full_time';
        verticalCounts[type] = (verticalCounts[type] || 0) + 1;

        const stateName = (o.state as any)?.name || 'Nationwide';
        stateCounts[stateName] = (stateCounts[stateName] || 0) + 1;
      }
    }

    const totalOpps = opps?.length || 0;

    const verticalDistribution = Object.entries(verticalCounts).map(([type, count]) => ({
      type,
      count,
      percent: totalOpps > 0 ? Math.round((count / totalOpps) * 100) : 0,
    }));

    const stateDistribution = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([state, count]) => ({
        state,
        count,
        percent: totalOpps > 0 ? Math.round((count / totalOpps) * 100) : 0,
      }));

    return NextResponse.json({
      totalPassesSold,
      grossRevenueNaira,
      paystackPercent,
      bankTransferPercent,
      activeSubscribers: activeSubscribers || 0,
      stateDistribution,
      verticalDistribution,
      totalOpportunities: totalOpps,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
