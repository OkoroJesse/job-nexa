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

    const { email, password, fullName, state } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: `Email address "${email}" is invalid` },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters in length' },
        { status: 400 }
      );
    }

    // Rate limit per IP + email key after input validation passes
    const rateLimitResponse = await enforceRateLimit(req, 'auth_register', normalizedEmail);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName?.trim() || null,
          state: state || 'Lagos',
        },
      },
    });

    if (error) {
      // Distinguish Supabase built-in auth rate limits from generic errors
      const isSupabaseRateLimit =
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('for security purposes');

      return NextResponse.json(
        {
          error: isSupabaseRateLimit
            ? 'Account registration temporarily throttled by authentication security. Please wait a moment before trying again.'
            : error.message,
        },
        { status: isSupabaseRateLimit ? 429 : 400 }
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
