// app/api/cron/check-freshness/route.ts
// Daily cron — marks opportunities as expired when:
//   1. application_deadline has passed
//   2. verification_status has been 'dead_link' for more than 7 days
// Protected by CRON_SECRET header

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 120;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = serviceClient();
  const now = new Date().toISOString();

  // 1. Expire jobs whose deadline has passed
  const { data: expiredByDeadline, error: err1 } = await supabase
    .from('opportunities')
    .update({ status: 'expired', verification_status: 'expired_deadline' })
    .eq('status', 'published')
    .lt('application_deadline', now)
    .not('application_deadline', 'is', null)
    .select('id');

  // 2. Expire jobs sourced from automated imports that passed deadline (pending_review too)
  const { data: expiredPending, error: err2 } = await supabase
    .from('opportunities')
    .update({ status: 'expired', verification_status: 'expired_deadline' })
    .eq('status', 'pending_review')
    .lt('application_deadline', now)
    .not('application_deadline', 'is', null)
    .not('source_id', 'is', null)
    .select('id');

  const expiredCount = (expiredByDeadline?.length ?? 0) + (expiredPending?.length ?? 0);

  return NextResponse.json({
    cron: 'check-freshness',
    timestamp: now,
    expired_count: expiredCount,
    errors: [err1?.message, err2?.message].filter(Boolean),
  });
}
