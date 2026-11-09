import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  CreditCard, 
  CheckSquare, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          JobNexa Operations Console
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Monitor subscriptions, audit incoming bank receipts, and review imported opportunities.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
            <span>Pending Bank Receipts</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-surface-900">3 Receipts</div>
          <Link
            href="/admin/verifications"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Open Verification Desk →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
            <span>Active 30-Day Pro Members</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-surface-900">184 Subscribers</div>
          <span className="text-[11px] text-surface-400">₦644,000 active MRR equivalent</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
            <span>Live Published Opportunities</span>
            <span className="p-1.5 rounded-lg bg-brand-50 text-primary">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-surface-900">8 Listings</div>
          <span className="text-[11px] text-surface-400">Across 36 states & FCT</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-surface-500">
            <span>Import Staging Queue</span>
            <span className="p-1.5 rounded-lg bg-surface-100 text-surface-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-surface-900">5 Drafts</div>
          <Link
            href="/admin/import-centre"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Review Staged Drafts →
          </Link>
        </div>
      </div>

      {/* Critical Verification Notice Banner */}
      <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-surface-900">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span>Operational Rule: Bank Receipt Verification Invariant</span>
        </div>
        <p className="text-xs sm:text-sm text-surface-600 leading-relaxed max-w-3xl">
          Under JobNexa&apos;s security protocol, <strong>a user receipt upload must NEVER automatically activate membership</strong>. An administrator or finance auditor must physically log in to the Zenith Bank corporate banking app, confirm that ₦3,500 has settled on the bank statement, and only then click &quot;Approve & Activate&quot;. The 30-day membership clock strictly commences from the timestamp of confirmed activation.
        </p>
        <Link
          href="/admin/verifications"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm"
        >
          <span>Go to Bank Verifications Desk</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
