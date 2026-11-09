// app/api/admin/sources/[id]/run/route.ts
// POST — manually trigger an import for a single source

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

  const result = await runSourceImport(
    source,
    'manual_admin',
    session.userId ?? null,
  );

  return NextResponse.json({ result });
}
