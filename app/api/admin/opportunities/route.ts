import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('q');

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();
      let query = adminClient
        .from('opportunities')
        .select(`
          *,
          category:categories(id, name, slug),
          state:locations_states(id, name, slug)
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('opportunity_type', type);
      }
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ opportunities: data || [] });
    }

    return NextResponse.json({ opportunities: [] });
  } catch (error) {
    console.error('Error fetching admin opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      organization_name,
      category_id,
      state_id,
      city,
      workplace_policy,
      opportunity_type,
      experience_level,
      salary_or_stipend_range,
      description,
      requirements,
      benefits,
      application_deadline,
      is_locked = true,
      employer_email,
      employer_phone,
      application_url,
      application_instructions,
      status = 'published',
      is_featured = false,
    } = body;

    if (!title || !organization_name || !description) {
      return NextResponse.json({ error: 'Title, organization, and description are required' }, { status: 400 });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    let insertedId = `opp-${Date.now()}`;

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient.from('opportunities').insert({
        title,
        slug,
        organization_name,
        category_id,
        state_id,
        city,
        workplace_policy: workplace_policy || 'on_site',
        opportunity_type: opportunity_type || 'full_time',
        experience_level,
        salary_or_stipend_range,
        description,
        requirements: requirements || '',
        benefits,
        application_deadline,
        is_locked: Boolean(is_locked),
        employer_email,
        employer_phone,
        application_url,
        application_instructions,
        status,
        is_featured: Boolean(is_featured),
        created_by: adminSession.userId === 'admin-system-root' ? null : adminSession.userId,
        published_at: status === 'published' ? new Date().toISOString() : null,
      }).select('id').single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      insertedId = data.id;

      await recordAdminAuditLog(
        adminSession.userId || 'admin',
        'create_opportunity',
        'opportunities',
        insertedId,
        { title, organization_name, status }
      );
    }

    return NextResponse.json({
      success: true,
      id: insertedId,
      slug,
      message: 'Opportunity created successfully',
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}
