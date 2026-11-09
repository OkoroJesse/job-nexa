import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';
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
      return NextResponse.json({ companies: [] });
    }

    const adminClient = createAdminClient();
    const { data: companies, error } = await adminClient
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ companies: companies || [] });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, industry, headquarters_city, official_email, official_phone, is_verified = true } = body;

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('companies')
      .insert({
        name,
        slug,
        industry: industry || 'Corporate',
        headquarters_city: headquarters_city || null,
        official_email: official_email || null,
        official_phone: official_phone || null,
        is_verified: Boolean(is_verified),
        verified_at: is_verified ? new Date().toISOString() : null,
        verified_by_admin_id: adminSession.userId === 'admin-system-root' ? null : adminSession.userId,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog(
      adminSession.userId || 'admin',
      'create_company',
      'companies',
      data.id,
      { name, is_verified }
    );

    return NextResponse.json({ success: true, company: data });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, is_verified } = body;

    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('companies')
      .update({
        is_verified,
        verified_at: is_verified ? new Date().toISOString() : null,
        verified_by_admin_id: is_verified ? (adminSession.userId === 'admin-system-root' ? null : adminSession.userId) : null,
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
      'toggle_company_verification',
      'companies',
      id,
      { is_verified }
    );

    return NextResponse.json({ success: true, company: data });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}
