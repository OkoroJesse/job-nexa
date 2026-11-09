// app/api/admin/sources/run-all/route.ts
// POST — run all active sources whose next_scheduled_poll_at has passed
//        Used by the cron job and the "Run All" button in the admin UI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSession } from '@/lib/admin-auth';
import { runSourceImport } from '@/lib/aggregation/importer';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  // Allow either admin session OR valid cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronCall) {
    const session = await getAdminSession();
    if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = serviceClient();

  // Fetch all active sources whose poll time has passed
  const { data: sources, error } = await supabase
    .from('authorized_sources')
    .select('*')
    .eq('is_active', true)
    .lte('next_scheduled_poll_at', new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!sources || sources.length === 0) {
    return NextResponse.json({ message: 'No sources due for import', results: [] });
  }

  const results = [];
  for (const source of sources) {
    const result = await runSourceImport(source, 'scheduler');
    results.push(result);

    // Update next scheduled poll time
    const nextPoll = new Date(
      Date.now() + (source.import_frequency_minutes ?? 1440) * 60_000,
    ).toISOString();
    await supabase
      .from('authorized_sources')
      .update({ next_scheduled_poll_at: nextPoll })
      .eq('id', source.id);
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}

