// app/api/admin/sources/[id]/route.ts
// GET   — single source
// PATCH — update / enable / disable
// DELETE — remove source

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSession } from '@/lib/admin-auth';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await serviceClient()
    .from('authorized_sources')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ source: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Whitelist updatable fields
  const allowed = [
    'name', 'source_type', 'endpoint_url', 'is_active', 'import_frequency_minutes',
    'auto_publish', 'default_attribution', 'attribution_required',
    'commercial_republication_status', 'rate_limit_rpm', 'config',
    'next_scheduled_poll_at',
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await serviceClient()
    .from('authorized_sources')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await serviceClient()
    .from('authorized_sources')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
