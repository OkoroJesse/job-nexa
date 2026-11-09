// app/api/admin/sources/[id]/test/route.ts
// POST — test a source connection and return sample data count

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSession } from '@/lib/admin-auth';
import { fetchGreenhouseJobs } from '@/lib/aggregation/adapters/greenhouse';
import { fetchLeverJobs } from '@/lib/aggregation/adapters/lever';
import { fetchJoobleJobs } from '@/lib/aggregation/adapters/jooble';
import { fetchRssJobs } from '@/lib/aggregation/adapters/rss';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: source, error } = await serviceClient()
    .from('authorized_sources')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  let result;
  try {
    switch (source.source_type) {
      case 'greenhouse':
        result = await fetchGreenhouseJobs(source);
        break;
      case 'lever':
        result = await fetchLeverJobs(source);
        break;
      case 'jooble':
        result = await fetchJoobleJobs(source);
        break;
      case 'rss':
      case 'json_api':
      case 'partner_api':
        result = await fetchRssJobs(source);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown source type: ${source.source_type}`,
        });
    }
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
    });
  }

  if (result.error && result.jobs.length === 0) {
    return NextResponse.json({ success: false, error: result.error, discovered: 0 });
  }

  return NextResponse.json({
    success: true,
    discovered: result.discovered_count,
    sample_jobs: result.jobs.slice(0, 3).map((j) => ({
      title: j.title,
      organization: j.organization_name,
      location: [j.city, j.state_name].filter(Boolean).join(', ') || 'Not specified',
      url: j.application_url,
    })),
    adapter_error: result.error ?? null,
  });
}
