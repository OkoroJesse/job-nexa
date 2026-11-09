'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Search, CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface PaystackRecord {
  id: string;
  reference: string;
  amount_kobo: number;
  status: 'approved' | 'pending_verification' | 'rejected' | 'refunded';
  channel: string;
  sender_bank_name: string | null;
  sender_account_name: string | null;
  created_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  } | null;
}

export default function AdminPaystackPage() {
  const [records, setRecords] = useState<PaystackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupRef, setLookupRef] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/paystack');
      const data = await res.json();
      if (res.ok && data.transactions) {
        setRecords(data.transactions);
      }
    } catch (err) {
      console.warn('Failed to fetch Paystack records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

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
        setVerificationResult({
          success: true,
          message: `Verified: Reference ${lookupRef} was confirmed on Paystack and activated.`,
        });
        fetchRecords();
      } else {
        setVerificationResult({
          success: false,
          message: data.error || 'Paystack could not verify this reference.',
        });
      }
    } catch {
      setVerificationResult({
        success: false,
        message: 'Network error while querying Paystack verification API.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Paystack Card Transactions
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Realtime audit log of ₦3,500 30-Day Pro Pass activations processed via Paystack.
          </p>
        </div>

        <button
          onClick={fetchRecords}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Manual Reference Re-Verification Desk */}
      <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-surface-900">
          <Search className="w-4 h-4 text-primary" />
          <span>Manual Paystack Reference Lookup</span>
        </div>
        <p className="text-xs text-surface-500 max-w-2xl">
          If a user claims a card debit occurred but their account did not unlock automatically due to browser interruption, query Paystack servers directly with their reference.
        </p>

        <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={lookupRef}
            onChange={(e) => setLookupRef(e.target.value)}
            placeholder="e.g. JN-PSTK-179424..."
            className="flex-1 px-4 py-2.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isVerifying}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isVerifying ? 'Querying Paystack...' : 'Verify Reference'}</span>
          </button>
        </form>

        {verificationResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              verificationResult.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {verificationResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{verificationResult.message}</span>
          </div>
        )}
      </div>

      {/* Live Transaction Ledger */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <span>Live Paystack Transactions ({records.length})</span>
        </h2>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-surface-200 text-center text-xs text-surface-500">
            Loading transaction ledger...
          </div>
        ) : records.length > 0 ? (
          <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-50 text-surface-600 font-semibold border-b border-surface-200">
                  <tr>
                    <th className="py-3 px-4">Paystack Reference</th>
                    <th className="py-3 px-4">Customer Email</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {records.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-surface-900">
                        {item.reference}
                      </td>
                      <td className="py-3.5 px-4 text-surface-700">
                        {item.profile?.email || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-surface-900">
                        ₦{((item.amount_kobo || 350000) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-surface-600">
                        {item.sender_bank_name || 'Card / Paystack'}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-surface-500">
                        {new Date(item.created_at).toLocaleString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-surface-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-100 text-surface-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-surface-900">No Paystack Transactions Yet</h3>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              When candidates upgrade via Paystack card or bank checkout, real-time transaction records will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
