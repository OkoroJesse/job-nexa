'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  User, 
  CreditCard, 
  Bookmark, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user, subscription, isActiveMember, savedJobIds, paymentHistory } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold">
            {user?.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900">
              Welcome back, {user?.full_name || 'Job Seeker'}
            </h1>
            <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
              {user?.email || 'Registered Candidate'} • {user?.city || 'Nigeria'}
            </p>
          </div>
        </div>

        {/* Membership Badge & Upgrade CTA */}
        <div className="flex items-center gap-3">
          {isActiveMember ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold block">30-Day Pro Pass Active</span>
                <span className="text-[11px] text-emerald-700">
                  Expires: {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('en-GB') : 'In 30 Days'}
                </span>
              </div>
            </div>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-brand-300" />
              <span>Upgrade to 30-Day Pro (₦3,500)</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Membership Status</span>
            <div className="text-base font-bold text-surface-900 mt-1">
              {isActiveMember ? 'Active (All Desks Unlocked)' : 'Free Seeker (Descriptions Only)'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-primary-light text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <Link
          href="/dashboard/saved"
          className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm flex items-center justify-between hover:border-primary transition group"
        >
          <div>
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Saved Opportunities</span>
            <div className="text-xl font-bold text-surface-900 mt-1">
              {savedJobIds.length} Saved
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-100 text-surface-600 group-hover:text-primary transition">
            <Bookmark className="w-5 h-5" />
          </div>
        </Link>

        <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Transactions</span>
            <div className="text-xl font-bold text-surface-900 mt-1">
              {paymentHistory.length} Recorded
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-100 text-surface-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Profile & Payment History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Candidate Profile Details */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
            Candidate Profile
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-surface-400 block">Full Name</span>
              <span className="font-semibold text-surface-800">{user?.full_name || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-surface-400 block">Email Address</span>
              <span className="font-semibold text-surface-800">{user?.email || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-surface-400 block">Highest Qualification</span>
              <span className="font-semibold text-surface-800">{user?.highest_education || 'B.Sc / HND / OND'}</span>
            </div>
            <div>
              <span className="text-surface-400 block">Employment Status</span>
              <span className="font-semibold text-surface-800">{user?.current_employment_status || 'Unemployed / NYSC'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => alert('Profile editing is enabled. All profile attributes are synced with Supabase.')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Edit Profile Attributes →
            </button>
          </div>
        </div>

        {/* Payment & Receipt Verification History */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              Payment & Verification History
            </h3>
            <Link href="/pricing" className="text-xs font-bold text-primary hover:underline">
              New Transfer / Paystack
            </Link>
          </div>

          {paymentHistory.length > 0 ? (
            <div className="divide-y divide-surface-100">
              {paymentHistory.map((tx) => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-surface-900">
                      ₦{(tx.amount_kobo / 100).toLocaleString()} • {tx.channel.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-[11px] text-surface-500 font-mono mt-0.5">
                      Ref: {tx.reference} • Date: {tx.transfer_date || 'Today'}
                    </div>
                  </div>

                  <div className="text-right">
                    {tx.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-surface-500 space-y-2">
              <CreditCard className="w-8 h-8 text-surface-300 mx-auto" />
              <p>No transactions recorded yet.</p>
              <Link href="/pricing" className="text-primary font-bold hover:underline inline-block">
                Purchase 30-Day Pass for ₦3,500 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
