'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, User, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('Lagos');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; needsConfirmation: boolean } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      // 1. Rate-limit and server-side validation via Upstash Redis
      const apiRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          state,
        }),
      });

      const apiData = await apiRes.json();

      if (!apiRes.ok) {
        setErrorMsg(apiData.error || 'Registration failed. Please check your details.');
        setLoading(false);
        return;
      }

      // 2. Synchronize client-side Supabase Auth session
      const supabase = createClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            state,
          },
        },
      });

      if (signUpError) {
        setErrorMsg(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData.session) {
        // Direct auto-login if email confirmation is turned off in Supabase
        router.push('/dashboard');
      } else {
        // Email confirmation is enabled
        setSuccessInfo({
          message: 'Account created! Please check your email to verify your address before signing in.',
          needsConfirmation: true,
        });
      }
    } catch {
      setErrorMsg('Unable to reach the registration server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14 space-y-6">
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
          Create Free Candidate Profile
        </h1>
        <p className="text-xs text-surface-500">
          Save listings, track opportunities across 36 Nigerian States & FCT, and access verified vacancies.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-200 shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
            {errorMsg}
          </div>
        )}

        {successInfo ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Registration Successful!</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">{successInfo.message}</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm mt-2"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Babatunde Fashola"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-surface-700 mb-1">Primary State of Residence</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Lagos">Lagos State</option>
                  <option value="FCT (Abuja)">FCT (Abuja)</option>
                  <option value="Rivers">Rivers State</option>
                  <option value="Oyo">Oyo State</option>
                  <option value="Kano">Kano State</option>
                  <option value="Kaduna">Kaduna State</option>
                  <option value="Enugu">Enugu State</option>
                  <option value="Delta">Delta State</option>
                  <option value="Ogun">Ogun State</option>
                  <option value="Edo">Edo State</option>
                  <option value="Anambra">Anambra State</option>
                  <option value="Other">Other State</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-surface-500 pt-2 border-t border-surface-100">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
