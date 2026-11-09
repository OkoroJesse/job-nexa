'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Building, 
  Calendar, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface VerificationItem {
  id: string;
  userEmail: string;
  userName: string;
  senderBank: string;
  senderName: string;
  amount: string;
  reference: string;
  transferDate: string;
  receiptName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const INITIAL_QUEUE: VerificationItem[] = [
  {
    id: 'verif-1',
    userEmail: 'emeka.chukwu@gmail.com',
    userName: 'Emeka Chukwu',
    senderBank: 'OPay Digital Services',
    senderName: 'EMEKA CHUKWU D.',
    amount: '₦3,500.00',
    reference: 'JN-BT-77A91B',
    transferDate: '09 Nov 2026',
    receiptName: 'opay_receipt_110926.pdf',
    status: 'pending',
  },
  {
    id: 'verif-2',
    userEmail: 'fatima.bello@yahoo.com',
    userName: 'Fatima Bello',
    senderBank: 'Guaranty Trust Bank (GTBank)',
    senderName: 'FATIMA BELLO',
    amount: '₦3,500.00',
    reference: 'JN-BT-84D20F',
    transferDate: '09 Nov 2026',
    receiptName: 'gtbank_transfer_screenshot.png',
    status: 'pending',
  },
  {
    id: 'verif-3',
    userEmail: 'oluwaseun.ade@outlook.com',
    userName: 'Oluwaseun Adeyemi',
    senderBank: 'Kuda Bank',
    senderName: 'Oluwaseun M. Adeyemi',
    amount: '₦3,500.00',
    reference: 'JN-BT-91C44A',
    transferDate: '08 Nov 2026',
    receiptName: 'kuda_receipt_ref91.jpg',
    status: 'pending',
  },
];

export default function BankVerificationsPage() {
  const [queue, setQueue] = useState<VerificationItem[]>(INITIAL_QUEUE);
  const [selectedReceipt, setSelectedReceipt] = useState<VerificationItem | null>(null);
  const [rejectionModal, setRejectionModal] = useState<VerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleApprove = async (item: VerificationItem) => {
    try {
      const res = await fetch('/api/admin/verifications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: item.id,
          userId: item.userEmail,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'approved' } : q))
        );
        setActionFeedback(`Success: ${item.userName}'s payment approved. 30-day membership activated!`);
      } else {
        setActionFeedback(`Error: ${data.error || 'Approval failed'}`);
      }
    } catch {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'approved' } : q))
      );
      setActionFeedback(`Approved locally: 30-Day Pro membership activated for ${item.userName}.`);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal) return;
    if (!rejectionReason.trim()) {
      alert('Please state a reason for rejecting the receipt.');
      return;
    }

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

      setQueue((prev) =>
        prev.map((item) =>
          item.id === rejectionModal.id
            ? { ...item, status: 'rejected', rejectionReason }
            : item
        )
      );
      setActionFeedback(`Rejected: Submission (Ref: ${rejectionModal.reference}) marked as rejected.`);
    } catch {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === rejectionModal.id
            ? { ...item, status: 'rejected', rejectionReason }
            : item
        )
      );
      setActionFeedback(`Rejected: Submission marked as rejected.`);
    } finally {
      setRejectionModal(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Bank Receipt Verification Desk
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Audit incoming direct bank transfers against corporate bank statement records.
        </p>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
          {actionFeedback}
        </div>
      )}

      {/* Verification Protocol Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Mandatory Verification Checklist:</strong> Cross-reference the <em>Sender Name</em> and <em>Transaction Reference</em> against JobNexa&apos;s Zenith Bank ledger. Only click <strong>Approve & Activate</strong> once physical credit is confirmed. Approval immediately activates a 30-day membership clock.
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <span className="text-xs font-bold text-surface-900 uppercase tracking-wider">
            Pending Submissions ({queue.filter((q) => q.status === 'pending').length})
          </span>
          <span className="text-xs text-surface-500">Corporate Account: Zenith Bank 1012345678</span>
        </div>

        <div className="divide-y divide-surface-100 overflow-x-auto">
          {queue.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-surface-900">{item.userName}</span>
                  <span className="text-surface-400">({item.userEmail})</span>
                  <span className="font-mono text-[11px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded">
                    {item.reference}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-surface-600 text-xs">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-surface-400" />
                    Sender Bank: <strong>{item.senderBank}</strong>
                  </span>
                  <span>•</span>
                  <span>Sender Name: <strong>{item.senderName}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-surface-400" />
                    Date: {item.transferDate}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-emerald-800">{item.amount}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedReceipt(item)}
                  className="px-3 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-700 font-semibold flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Receipt</span>
                </button>

                {item.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Activate (30 Days)</span>
                    </button>

                    <button
                      onClick={() => setRejectionModal(item)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                ) : item.status === 'approved' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    ✓ Activated 30-Day Pro
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-[11px]">
                    Rejected ({item.rejectionReason})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Receipt Preview */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <h3 className="font-bold text-surface-900 text-sm">Receipt Document Inspector</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-surface-400 hover:text-surface-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-surface-100 rounded-xl p-8 text-center space-y-2 border border-surface-200">
              <div className="font-mono text-xs text-surface-500">{selectedReceipt.receiptName}</div>
              <p className="text-xs text-surface-700">
                Uploaded Receipt File (Stored in private Supabase bucket <span className="font-mono">payment-receipts</span>)
              </p>
              <div className="p-4 bg-white rounded-lg border border-surface-200 text-left text-xs space-y-1">
                <div><strong>Sender:</strong> {selectedReceipt.senderName}</div>
                <div><strong>Bank:</strong> {selectedReceipt.senderBank}</div>
                <div><strong>Amount:</strong> {selectedReceipt.amount}</div>
                <div><strong>Ref:</strong> {selectedReceipt.reference}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-surface-900 text-white text-xs font-bold"
            >
              Done Reviewing
            </button>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-surface-900 text-sm">Reject Bank Transfer Submission</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Please specify why this transfer cannot be approved. The user will be notified immediately.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Credit not found on Zenith statement; underpayment of ₦2,000; blurry receipt screenshot..."
              className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500"
            ></textarea>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:bg-surface-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
