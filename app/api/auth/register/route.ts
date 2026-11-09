import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // 1. Rate limiting via Upstash Redis (3 registrations per minute per IP)
  const rateLimitResponse = await enforceRateLimit(req, 'auth_register');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password, fullName, state } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters in length' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || null,
          state: state || 'Lagos',
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Check if email confirmation is required by Supabase
    const needsEmailConfirmation = !data.session && data.user;

    return NextResponse.json({
      success: true,
      needsEmailConfirmation,
      message: needsEmailConfirmation
        ? 'Account created! Please check your email inbox to verify your account before logging in.'
        : 'Account created successfully!',
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });
  } catch (err: any) {
    console.error('Auth registration error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
