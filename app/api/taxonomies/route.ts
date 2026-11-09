import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';

export async function GET() {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      return NextResponse.json({ categories: [], states: [] });
    }

    const adminClient = createAdminClient();

    const [catRes, stateRes] = await Promise.all([
      adminClient.from('categories').select('*').order('sort_order', { ascending: true }),
      adminClient.from('locations_states').select('*').order('name', { ascending: true }),
    ]);

    return NextResponse.json({
      categories: catRes.data || [],
      states: stateRes.data || [],
    });
  } catch (error) {
    console.error('Error fetching taxonomies:', error);
    return NextResponse.json({ error: 'Failed to fetch taxonomies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, is_featured } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        is_featured: Boolean(is_featured),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog(
      adminSession.userId || 'admin',
      'create_category',
      'categories',
      data.id,
      { name, slug }
    );

    return NextResponse.json({ category: data });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
