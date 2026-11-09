import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // 1. Rate limiting via Upstash Redis (3 password reset requests per 5 minutes per IP)
  const rateLimitResponse = await enforceRateLimit(req, 'auth_forgot_password');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${siteUrl}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
