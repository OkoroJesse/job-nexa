'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Rate-limit and server-side credential verification
      const verifyRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setErrorMsg(verifyData.error || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // 2. Hydrate client-side Supabase Auth session
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const redirectParam = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('redirect')
          : null;

        if (redirectParam && redirectParam.startsWith('/')) {
          router.push(redirectParam);
        } else if (verifyData.redirectTo) {
          router.push(verifyData.redirectTo);
        } else {
          router.push('/dashboard');
        }
      }
    } catch {
      setErrorMsg('Unable to connect to authentication server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Image
            src="/brand/jobnexa-icon.png"
            alt="JobNexa Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-surface-900 font-sans">
            Job<span className="text-primary">Nexa</span>
          </span>
        </Link>
        <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-xs text-surface-500">
          Sign in to your candidate or administrator account.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-200 shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-surface-700">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-surface-500 pt-2 border-t border-surface-100">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Register for free
          </Link>
        </div>
      </div>
    </div>
  );
}
