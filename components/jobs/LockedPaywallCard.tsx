'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, Check, Sparkles, CreditCard, Building } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LockedPaywallCard() {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-br from-surface-900 to-surface-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-surface-700 relative overflow-hidden">
      {/* Subtle accent corner glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4">
          <Lock className="w-3.5 h-3.5" />
          <span>Employer Contact Information & Application Dossier Locked</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Unlock Direct Application Details with 30-Day Pro Pass
        </h3>

        <p className="text-surface-300 text-sm leading-relaxed mb-6 max-w-2xl">
          To protect Nigerian candidates from employment scams and prevent unsolicited spam, direct HR submission emails, verified recruiter WhatsApp contacts, and proprietary application dossiers require an active JobNexa membership.
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="flex items-start gap-2 text-xs sm:text-sm text-surface-200">
            <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>Direct Hiring Manager & HR email addresses</span>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm text-surface-200">
            <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>Verified Recruiter WhatsApp & phone contacts</span>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm text-surface-200">
            <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>Step-by-step submission & cover letter instructions</span>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm text-surface-200">
            <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>30 days of unlimited access across all 36 States & FCT</span>
          </div>
        </div>

        {/* Pricing & CTA Block */}
        <div className="bg-surface-800/80 rounded-xl p-5 border border-surface-700 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <div className="text-xs text-surface-400 uppercase tracking-wider font-semibold">
              One-Time 30-Day Pass
            </div>
            <div className="flex items-baseline justify-center sm:justify-start gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-white">₦3,500</span>
              <span className="text-xs text-surface-400">/ 30 days (No auto-debit)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/pricing"
              className="w-full sm:w-auto text-center px-6 py-3 rounded-lg text-sm font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 transition shadow-sm"
            >
              Get 30-Day Pass (₦3,500)
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-surface-400">
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-surface-400" />
            Paystack & Direct Bank Transfer
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            Zero recurring card debits
          </span>
        </div>
      </div>
    </div>
  );
}
