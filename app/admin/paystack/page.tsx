'use client';

import React, { useState } from 'react';
import { CreditCard, Search, CheckCircle2, Clock, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface PaystackRecord {
  id: string;
  reference: string;
  customerEmail: string;
  amountKobo: number;
  status: 'approved' | 'pending' | 'failed';
  channel: string;
  paidAt: string;
  isSubscriptionActive: boolean;
}

const INITIAL_RECORDS: PaystackRecord[] = [
  {
    id: 'pstk-1',
    reference: 'PSTK_A89F012B',
    customerEmail: 'chidinma.pro@jobnexa.ng',
    amountKobo: 350000,
    status: 'approved',
    channel: 'Mastercard •••• 4242',
    paidAt: '09 Nov 2026, 11:24 WAT',
    isSubscriptionActive: true,
  },
  {
    id: 'pstk-2',
    reference: 'PSTK_B99C4410',
    customerEmail: 'kazeem.sanusi@gmail.com',
    amountKobo: 350000,
    status: 'approved',
    channel: 'Access Bank Transfer',
    paidAt: '08 Nov 2026, 16:02 WAT',
    isSubscriptionActive: true,
  },
  {
    id: 'pstk-3',
    reference: 'PSTK_C77E8821',
    customerEmail: 'amina.b@yahoo.com',
    amountKobo: 350000,
    status: 'failed',
    channel: 'Verve •••• 1109',
    paidAt: '08 Nov 2026, 14:15 WAT',
    isSubscriptionActive: false,
  },
];

export default function AdminPaystackPage() {
  const [records, setRecords] = useState<PaystackRecord[]>(INITIAL_RECORDS);
  const [lookupRef, setLookupRef] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRef.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: lookupRef.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setVerificationResult(`Success: Reference verified! ${data.message}`);
        // Add to records
        setRecords([
          {
            id: `pstk-${Date.now()}`,
            reference: lookupRef.trim(),
            customerEmail: 'verified.user@jobnexa.ng',
            amountKobo: 350000,
            status: 'approved',
            channel: 'Paystack Verified',
            paidAt: 'Just now',
            isSubscriptionActive: true,
          },
          ...records,
        ]);
        setLookupRef('');
      } else {
        setVerificationResult(`Error: ${data.error || 'Verification failed'}`);
      }
    } catch {
      setVerificationResult('Network error while checking reference with Paystack');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Paystack Transactions & Reconciliation
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Monitor automated card, USSD, and bank transfer charges processed through Paystack.
        </p>
      </div>

      {/* Manual Verification Bar */}
      <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700">
          Manual Reference Verification & Activation Tool
        </h3>
        <p className="text-xs text-surface-500">
          If a user completed a payment but closed their browser before the webhook fired, enter the Paystack reference below to re-verify against the Paystack API and idempotently activate their 30-day membership.
        </p>

        <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value)}
              placeholder="e.g. PSTK_XXXXXXXX or T1234567890..."
              className="w-full pl-9 pr-3 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying with Paystack...' : 'Verify Reference'}</span>
          </button>
        </form>

        {verificationResult && (
          <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
            verificationResult.startsWith('Success')
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}>
            {verificationResult}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <span className="text-xs font-bold text-surface-900 uppercase tracking-wider">
            Recent Paystack Charges ({records.length})
          </span>
          <span className="text-xs text-surface-500 font-semibold">Standard Fee: ₦3,500.00</span>
        </div>

        <div className="divide-y divide-surface-100 overflow-x-auto">
          {records.map((rec) => (
            <div key={rec.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-surface-900 text-sm">{rec.reference}</span>
                  <span className="text-surface-500">• {rec.customerEmail}</span>
                </div>
                <div className="text-surface-500 text-xs">
                  Channel: {rec.channel} • Timestamp: {rec.paidAt} • Amount: <strong className="text-emerald-800">₦{(rec.amountKobo / 100).toLocaleString()}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {rec.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Success (30-Day Pro Active)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                    Failed Charge
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
