import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // 1. Rate limiting via Upstash Redis (5 attempts per minute per IP)
  const rateLimitResponse = await enforceRateLimit(req, 'auth_login');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
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
