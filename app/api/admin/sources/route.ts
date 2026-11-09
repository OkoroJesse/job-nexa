// app/api/admin/sources/route.ts
// GET  — list all authorized_sources
// POST — create a new authorized_source

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSession } from '@/lib/admin-auth';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('authorized_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    name,
    source_type,
    endpoint_url,
    import_frequency_minutes = 1440,
    auto_publish = false,
    default_attribution,
    attribution_required = true,
    commercial_republication_status = 'under_review',
    rate_limit_rpm = 30,
    config = {},
    is_active = false,
  } = body as Record<string, unknown>;

  if (!name || !source_type || !endpoint_url) {
    return NextResponse.json({ error: 'name, source_type and endpoint_url are required' }, { status: 400 });
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('authorized_sources')
    .insert({
      name,
      source_type,
      endpoint_url,
      import_frequency_minutes,
      auto_publish,
      default_attribution: default_attribution ?? null,
      attribution_required,
      commercial_republication_status,
      rate_limit_rpm,
      config,
      is_active,
      created_by: session.userId ?? null,
      next_scheduled_poll_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source: data }, { status: 201 });
}

