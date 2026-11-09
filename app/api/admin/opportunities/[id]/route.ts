import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return NextResponse.json({ opportunity: data });
      }
    }

    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from('opportunities')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await recordAdminAuditLog(
        adminSession.userId || 'admin',
        'update_opportunity',
        'opportunities',
        id,
        body
      );

      return NextResponse.json({ success: true, opportunity: data });
    }

    return NextResponse.json({ error: 'Database service not configured' }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { error } = await adminClient.from('opportunities').delete().eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await recordAdminAuditLog(
        adminSession.userId || 'admin',
        'delete_opportunity',
        'opportunities',
        id,
        { deleted: true }
      );

      return NextResponse.json({ success: true, message: 'Deleted successfully' });
    }

    return NextResponse.json({ error: 'Database service not configured' }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 });
  }
}
