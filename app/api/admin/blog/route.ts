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
      return NextResponse.json({ posts: [] });
    }

    const adminClient = createAdminClient();
    const { data: posts, error } = await adminClient
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { title, category, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const excerpt = content.substring(0, 160).replace(/\n/g, ' ') + '...';
    const readTimeMinutes = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (!isConfigured) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('blog_posts')
      .insert({
        slug,
        title,
        excerpt,
        content,
        category: category || 'Career Advice',
        author_name: adminSession.fullName || 'JobNexa Editorial Team',
        read_time_minutes: readTimeMinutes,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog(
      adminSession.userId || 'admin',
      'publish_blog_post',
      'blog_posts',
      data.id,
      { title, slug }
    );

    return NextResponse.json({ success: true, post: data });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
