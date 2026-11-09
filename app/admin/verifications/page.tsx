'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Building, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface VerificationTransaction {
  id: string;
  user_id: string;
  amount_kobo: number;
  currency: string;
  channel: string;
  status: 'pending_verification' | 'approved' | 'rejected' | 'refunded';
  reference: string;
  receipt_storage_path: string | null;
  sender_bank_name: string | null;
  sender_account_name: string | null;
  transfer_date: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
    phone_number: string | null;
  } | null;
}

export default function BankVerificationsPage() {
  const [queue, setQueue] = useState<VerificationTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<VerificationTransaction | null>(null);
  const [rejectionModal, setRejectionModal] = useState<VerificationTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verifications');
      const data = await res.json();
      if (res.ok && data.transactions) {
        setQueue(data.transactions);
      }
    } catch (err) {
      console.warn('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (item: VerificationTransaction) => {
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/verifications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: item.id,
          userId: item.user_id,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'approved' } : q))
        );
        setActionFeedback(`Success: ${item.profile?.full_name || 'Candidate'}'s payment approved and 30-Day Pro Membership activated.`);
      } else {
        setActionFeedback(`Error: ${data.error || 'Approval failed'}`);
      }
    } catch {
      setActionFeedback('Network error while processing approval.');
    }
  };

  const handleReject = async () => {
    if (!rejectionModal) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a reason for rejecting the receipt.');
      return;
    }

    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/verifications/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: rejectionModal.id,
          rejectionReason,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === rejectionModal.id
              ? { ...q, status: 'rejected', rejection_reason: rejectionReason }
              : q
          )
        );
        setActionFeedback(`Payment rejected. The reason has been recorded.`);
        setRejectionModal(null);
        setRejectionReason('');
      } else {
        setActionFeedback(`Error: ${data.error || 'Rejection failed'}`);
      }
    } catch {
      setActionFeedback('Network error while recording rejection.');
    }
  };

  const pendingItems = queue.filter((item) => item.status === 'pending_verification');
  const auditedItems = queue.filter((item) => item.status !== 'pending_verification');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Bank Transfer Verification Desk
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Audit user-submitted teller receipts against your receiving bank statement before activating access.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between gap-4 ${
            actionFeedback.startsWith('Success')
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-xs underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Verification Invariant Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-950 flex items-start gap-3.5">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-900">Security Rule: Physical Settlement Mandatory</div>
          <p className="text-amber-800 leading-relaxed">
            Never approve a transaction solely based on an uploaded image, as receipts can be edited. Always check your receiving bank corporate statement or alert to confirm that <strong>₦3,500</strong> has settled with matching reference or sender name.
          </p>
        </div>
      </div>

      {/* Pending Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending Audit Queue ({pendingItems.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-surface-200 text-center text-xs text-surface-500">
            Loading verification queue...
          </div>
        ) : pendingItems.length > 0 ? (
          <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-50 text-surface-600 font-semibold border-b border-surface-200">
                  <tr>
                    <th className="py-3 px-4">Candidate & Reference</th>
                    <th className="py-3 px-4">Sender Details</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Transfer Date</th>
                    <th className="py-3 px-4">Receipt File</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {pendingItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-surface-900">
                          {item.profile?.full_name || 'Registered Candidate'}
                        </div>
                        <div className="text-[11px] text-surface-500">{item.profile?.email || 'N/A'}</div>
                        <span className="font-mono text-[10px] text-primary block mt-0.5 font-bold">
                          {item.reference}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-surface-800">{item.sender_bank_name || 'N/A'}</div>
                        <div className="text-[11px] text-surface-500">
                          Sender: {item.sender_account_name || 'Not provided'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-surface-900">
                        ₦{((item.amount_kobo || 350000) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-surface-600">
                        {item.transfer_date || new Date(item.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.receipt_storage_path ? (
                          <button
                            onClick={() => setSelectedReceipt(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100 text-surface-700 hover:bg-surface-200 transition font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect File</span>
                          </button>
                        ) : (
                          <span className="text-surface-400 italic">No file attached</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectionModal(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-red-50 hover:text-red-700 text-surface-600 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-surface-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-surface-900">Verification Queue Clear</h3>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              There are no pending bank transfer receipts awaiting verification. Incoming candidate submissions will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Audited History Section */}
      {auditedItems.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-surface-200">
          <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audited Verification History ({auditedItems.length})</span>
          </h2>

          <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-50 text-surface-600 font-semibold border-b border-surface-200">
                  <tr>
                    <th className="py-3 px-4">Candidate & Reference</th>
                    <th className="py-3 px-4">Bank & Sender</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {auditedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-surface-900">
                          {item.profile?.full_name || 'Registered Candidate'}
                        </div>
                        <div className="text-[11px] text-surface-500 font-mono">{item.reference}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-surface-800">{item.sender_bank_name || 'N/A'}</div>
                        <div className="text-[11px] text-surface-500">{item.sender_account_name || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-surface-900">
                        ₦{((item.amount_kobo || 350000) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-surface-600">
                        {item.status === 'approved' ? (
                          <span>Activated 30-Day Pro Pass</span>
                        ) : (
                          <span className="text-red-700">Reason: {item.rejection_reason || 'Unspecified'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Reject Bank Transfer Receipt</span>
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Candidate: <strong>{rejectionModal.profile?.full_name || 'Candidate'}</strong> ({rejectionModal.reference})
            </p>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                Reason for Rejection (Required)
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Funds not found on receiving bank statement, blurry screenshot, invalid amount."
                className="w-full p-3 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectionModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:bg-surface-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>Uploaded Payment Proof</span>
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-xs text-surface-400 hover:text-surface-700"
              >
                Close ✕
              </button>
            </div>
            <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-surface-500">Storage Key:</span>
                <span className="font-mono text-surface-800 break-all">{selectedReceipt.receipt_storage_path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Reference:</span>
                <span className="font-mono text-primary font-bold">{selectedReceipt.reference}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-100 text-surface-700 hover:bg-surface-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
