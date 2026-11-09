'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, Lock, Mail, User, MapPin, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { loginDemoUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('Lagos');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            state: state,
          },
        },
      });

      if (error) {
        setErrorMsg(`${error.message}. You can also use the Instant Test Login below.`);
      } else {
        // Success or test registration
        loginDemoUser('free');
        router.push('/dashboard');
      }
    } catch {
      loginDemoUser('free');
      router.push('/dashboard');
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
          Browse verified opportunities, save jobs, and track your applications.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-200 shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Full Legal Name</label>
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
            <label className="block text-xs font-semibold text-surface-700 mb-1">State of Residence</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Lagos">Lagos State</option>
                <option value="Abuja">Federal Capital Territory (Abuja)</option>
                <option value="Rivers">Rivers State</option>
                <option value="Oyo">Oyo State</option>
                <option value="Kano">Kano State</option>
                <option value="Kaduna">Kaduna State</option>
                <option value="Enugu">Enugu State</option>
                <option value="Delta">Delta State</option>
                <option value="Other">Other State (36 States)</option>
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
            <span>{loading ? 'Creating Account...' : 'Register with Supabase'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-surface-500 pt-2">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
