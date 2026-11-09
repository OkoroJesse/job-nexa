'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Check,
  ShieldCheck,
  CreditCard,
  Building,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface BankConfig {
  is_enabled: boolean;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  transfer_instructions: string | null;
}

export default function PricingPage() {
  const { user, isActiveMember, subscription, simulatePaystackSuccess, submitBankTransferReceipt } =
    useAuth();

  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [bankConfigLoading, setBankConfigLoading] = useState(true);

  const [selectedMethod, setSelectedMethod] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [senderBank, setSenderBank] = useState('');
  const [senderName, setSenderName] = useState(user?.full_name || '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchBankConfig() {
      try {
        const res = await fetch('/api/payment/bank-config');
        if (res.ok) {
          const data: BankConfig = await res.json();
          setBankConfig(data);
          // If bank transfer is not configured, default to paystack
          if (!data.is_enabled) {
            setSelectedMethod('paystack');
          }
        }
      } catch {
        setBankConfig({ is_enabled: false, bank_name: null, account_number: null, account_name: null, transfer_instructions: null });
      } finally {
        setBankConfigLoading(false);
      }
    }
    fetchBankConfig();
  }, []);

  const handleCopyAccountNumber = () => {
    if (bankConfig?.account_number) {
      navigator.clipboard.writeText(bankConfig.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderBank || !senderName) {
      alert('Please fill in your bank name and account sender name.');
      return;
    }
    setIsSubmitting(true);
    const res = await submitBankTransferReceipt({ senderBank, senderName, receiptFile });
    setIsSubmitting(false);
    setSubmissionFeedback(res.message);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-primary border border-brand-200">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Fair & Transparent Nigerian Opportunities Pass</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-surface-900 tracking-tight">
          Invest in Your Next Career Breakthrough
        </h1>
        <p className="text-sm sm:text-base text-surface-600 leading-relaxed">
          Access verified direct HR contacts, recruiter WhatsApp desks, and step-by-step application
          instructions for 30 consecutive days. No surprise auto-debits.
        </p>
      </div>

      {/* Active Subscription Banner */}
      {isActiveMember && subscription && (
        <div className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-brand-500/20 text-brand-300">
              <Sparkles className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Your 30-Day Pro Membership is Active!</h3>
              <p className="text-xs text-emerald-200 mt-1">
                Valid until:{' '}
                <strong>
                  {subscription.expires_at
                    ? new Date(subscription.expires_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '30 Days'}
                </strong>
                . All employer contacts across 36 states are unlocked.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-400 text-slate-950">
            Active Status
          </span>
        </div>
      )}

      {/* Main Pricing Box */}
      <div className="bg-white rounded-3xl border border-surface-200 shadow-sm p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Plan Details */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              All-Inclusive Candidate Pass
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-surface-900 font-sans">
                ₦3,500
              </span>
              <span className="text-sm text-surface-500">/ 30 Days (One-time)</span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              No automatic renewal. No card recurring charges in V1.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <h4 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
              What You Get with Your 30-Day Pass:
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-surface-700">
              {[
                'Direct HR & Hiring Manager emails for verified corporate jobs',
                'Verified Recruiter WhatsApp desks & phone contacts',
                'Direct high-stipend NYSC PPA applications across all 36 States & FCT',
                'Specialized Graduate Trainee application dossiers & cover letter requirements',
                'Curated remote opportunities paying in USD / Foreign Currency',
                'Strict anti-scam protection: every employer contact is audited',
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 text-xs text-surface-600 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p>
              <strong>Zero Risk Policy:</strong> If a contact is found to be invalid or an employer
              asks for an interview fee, our support desk will extend your pass by 14 days free of
              charge.
            </p>
          </div>
        </div>

        {/* Payment Rails */}
        <div className="lg:col-span-5 bg-surface-50 p-6 rounded-2xl border border-surface-200 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-surface-900">Select Payment Method</h3>

            {bankConfigLoading ? (
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading payment options...</span>
              </div>
            ) : (
              <>
                {/* Method Toggle */}
                <div
                  className={`grid gap-2 p-1 bg-surface-200/70 rounded-xl ${
                    bankConfig?.is_enabled ? 'grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('paystack')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      selectedMethod === 'paystack'
                        ? 'bg-white text-surface-900 shadow-sm'
                        : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    <span>Paystack (Instant)</span>
                  </button>

                  {bankConfig?.is_enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('bank_transfer')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        selectedMethod === 'bank_transfer'
                          ? 'bg-white text-surface-900 shadow-sm'
                          : 'text-surface-600 hover:text-surface-900'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Bank Transfer</span>
                    </button>
                  )}
                </div>

                {/* Paystack */}
                {selectedMethod === 'paystack' && (
                  <div className="space-y-4 pt-2">
                    <div className="text-xs text-surface-600 leading-relaxed">
                      Pay securely with your Nigerian Debit Card (Mastercard, Visa, Verve), USSD,
                      or Bank Transfer via Paystack. Your membership activates{' '}
                      <strong>instantly</strong> upon successful charge.
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-surface-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-surface-500">Plan:</span>
                        <span className="font-semibold text-surface-900">30-Day All-Access Pass</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-500">Amount:</span>
                        <span className="font-bold text-primary">₦3,500.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-500">Auto-Renewal:</span>
                        <span className="font-semibold text-surface-700">None (One-time)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={simulatePaystackSuccess}
                      className="w-full py-3.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₦3,500 via Paystack</span>
                    </button>
                    <p className="text-[11px] text-surface-400 text-center">
                      256-bit encrypted • PCI-DSS Level 1 Certified
                    </p>
                  </div>
                )}

                {/* Bank Transfer */}
                {selectedMethod === 'bank_transfer' && bankConfig?.is_enabled && (
                  <div className="space-y-4 pt-1">
                    {submissionFeedback ? (
                      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <span>Receipt Uploaded Successfully</span>
                        </div>
                        <p className="leading-relaxed">{submissionFeedback}</p>
                        <p className="font-semibold text-primary pt-1">
                          Our finance desk is auditing credit on the bank statement. You will be
                          notified once activated!
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleBankTransferSubmit} className="space-y-3">
                        {/* Platform bank details */}
                        <div className="bg-white p-3.5 rounded-xl border border-surface-200 text-xs space-y-1.5">
                          <p className="text-[11px] text-surface-500 font-semibold uppercase tracking-wider">
                            Transfer to:
                          </p>
                          <div className="flex justify-between">
                            <span className="text-surface-500">Bank:</span>
                            <span className="font-bold text-surface-900">
                              {bankConfig.bank_name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-surface-500">Account No:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-primary text-sm select-all">
                                {bankConfig.account_number}
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyAccountNumber}
                                className="text-surface-400 hover:text-primary transition"
                                title="Copy account number"
                              >
                                {copied ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-surface-500">Account Name:</span>
                            <span className="font-semibold text-surface-900">
                              {bankConfig.account_name}
                            </span>
                          </div>
                          {bankConfig.transfer_instructions && (
                            <p className="pt-1 text-[11px] text-surface-500 leading-relaxed border-t border-surface-100 mt-1">
                              {bankConfig.transfer_instructions}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-surface-700">
                              Your Bank Name (e.g. GTBank, OPay, Kuda)
                            </label>
                            <input
                              type="text"
                              required
                              value={senderBank}
                              onChange={(e) => setSenderBank(e.target.value)}
                              placeholder="e.g. OPay / Zenith Bank"
                              className="w-full px-3 py-1.5 text-xs text-surface-900 bg-white border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-surface-700">
                              Sender Account Name (Name on your bank app)
                            </label>
                            <input
                              type="text"
                              required
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              placeholder="e.g. Tunde Adeleke"
                              className="w-full px-3 py-1.5 text-xs text-surface-900 bg-white border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-surface-700">
                              Attach Payment Receipt (Screenshot / PDF)
                            </label>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                              className="w-full text-[11px] text-surface-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary hover:file:text-white"
                            />
                          </div>
                        </div>

                        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-tight">
                          <strong>Verification Invariant:</strong> Uploading a receipt creates a{' '}
                          <em>Pending Verification</em> record. An administrator verifies actual
                          bank ledger credit before activating your 30-day membership.
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {isSubmitting ? 'Uploading...' : 'Submit Receipt for Verification'}
                          </span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="pt-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-surface-900 text-center">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              q: 'Will my card be charged again automatically next month?',
              a: "No. In V1 of JobNexa, there is strictly zero automatic recurring billing. Your ₦3,500 purchase grants 30 days of all-access. When the 30 days elapse, your membership expires quietly. You decide if and when to purchase another pass.",
            },
            {
              q: 'How long does bank transfer receipt verification take?',
              a: "Our financial verification desk audits incoming bank transfers within 2 to 4 hours during business hours (8 AM – 8 PM WAT). Once your bank credit is confirmed, your 30-day access begins from that exact moment.",
            },
            {
              q: 'Can I browse jobs without paying?',
              a: "Yes! You can browse the entire directory, filter by state, and read full job descriptions, responsibilities, and requirements completely free. The ₦3,500 fee is only required to unlock the employer's verified email, WhatsApp desk, and direct application link.",
            },
            {
              q: "Why doesn't JobNexa charge employers instead?",
              a: "By keeping employer listings free and highly vetted, we attract hundreds of authentic corporate HR managers, NYSC PPA coordinators, and international recruiters who refuse to pay expensive ₦100,000 legacy board fees.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white p-5 rounded-xl border border-surface-200 space-y-2">
              <h4 className="text-sm font-bold text-surface-900">{q}</h4>
              <p className="text-xs text-surface-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
