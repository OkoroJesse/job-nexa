'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginDemoUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase credentials are placeholder or user not found, offer demo fallback
        setErrorMsg(`${error.message}. You can also use the Instant Test Login buttons below.`);
      } else if (data?.user) {
        // Query user's role to direct admins to /admin and job seekers to /dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const adminRoles = ['super_admin', 'admin', 'finance_auditor', 'moderator'];
        const redirectParam = typeof window !== 'undefined' 
          ? new URLSearchParams(window.location.search).get('redirect') 
          : null;

        if (redirectParam && redirectParam.startsWith('/')) {
          router.push(redirectParam);
        } else if (profile && adminRoles.includes(profile.role)) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch {
      setErrorMsg('Network error. You can use the 1-Click Demo Login below to test the platform.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (mode: 'free' | 'pro') => {
    loginDemoUser(mode);
    router.push('/dashboard');
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
          Sign in to access your saved opportunities and application dossiers.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-200 shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
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
            <label className="block text-xs font-semibold text-surface-700 mb-1">Password</label>
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
            <span>{loading ? 'Signing in...' : 'Sign In with Supabase'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Test Perspectives for Assessment */}
        <div className="pt-4 border-t border-surface-100 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 text-center">
            Instant Test Login (No password needed)
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('free')}
              className="p-2.5 rounded-xl border border-surface-200 hover:border-surface-300 bg-surface-50 text-left transition"
            >
              <div className="text-xs font-bold text-surface-900">Free Seeker</div>
              <div className="text-[10px] text-surface-500">Locked contact view</div>
            </button>

            <button
              onClick={() => handleQuickDemo('pro')}
              className="p-2.5 rounded-xl border border-brand-300 hover:border-brand-400 bg-brand-50/50 text-left transition"
            >
              <div className="text-xs font-bold text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-500" />
                <span>30-Day Pro</span>
              </div>
              <div className="text-[10px] text-emerald-700">Unlocked contact view</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-surface-500 pt-2">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Register for free
          </Link>
        </div>
      </div>
    </div>
  );
}
