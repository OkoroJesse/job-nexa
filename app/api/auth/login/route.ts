import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Rate limiting via Upstash Redis isolated by email & client IP
    const rateLimitResponse = await enforceRateLimit(req, 'auth_login', normalizedEmail);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const isSupabaseRateLimit =
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('for security purposes');

      return NextResponse.json(
        {
          error: isSupabaseRateLimit
            ? 'Too many login attempts. Please wait a moment before trying again.'
            : error.message,
        },
        { status: isSupabaseRateLimit ? 429 : 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed. Please verify your credentials.' },
        { status: 401 }
      );
    }

    // Query user profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'job_seeker';
    const adminRoles = ['super_admin', 'admin', 'finance_auditor', 'moderator'];
    const redirectTo = adminRoles.includes(role) ? '/admin' : '/dashboard';

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name || null,
        role,
      },
      redirectTo,
    });
  } catch (err: any) {
    console.error('Auth login error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
