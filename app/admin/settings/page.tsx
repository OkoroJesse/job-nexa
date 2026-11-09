'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  Building,
  CreditCard,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react';

interface BankConfig {
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  transfer_instructions: string | null;
  is_enabled: boolean;
  demo_mode?: boolean;
}

interface SaveState {
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string | null;
}

export default function AdminSettingsPage() {
  const [bankConfig, setBankConfig] = useState<BankConfig>({
    bank_name: '',
    account_number: '',
    account_name: '',
    transfer_instructions:
      'Transfer exactly ₦3,500. Use your full name as the payment description. Upload your transaction receipt below. Your membership will only be activated after credit is confirmed on our bank ledger.',
    is_enabled: false,
  });

  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bankSaveState, setBankSaveState] = useState<SaveState>({ status: 'idle', message: null });
  const [demoMode, setDemoMode] = useState(false);

  const fetchBankConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/bank-account');
      if (res.ok) {
        const data: BankConfig = await res.json();
        setBankConfig({
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
          transfer_instructions: data.transfer_instructions || '',
          is_enabled: data.is_enabled,
        });
        setDemoMode(!!data.demo_mode);
      }
    } catch (err) {
      console.error('Failed to fetch bank config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankConfig();
  }, [fetchBankConfig]);

  const handleBankConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaveState({ status: 'saving', message: null });

    // Client-side validation
    if (bankConfig.is_enabled) {
      if (!bankConfig.bank_name?.trim()) {
        setBankSaveState({ status: 'error', message: 'Bank name is required when bank transfer is enabled.' });
        return;
      }
      if (!bankConfig.account_number?.trim()) {
        setBankSaveState({ status: 'error', message: 'Account number is required when bank transfer is enabled.' });
        return;
      }
      if (!/^\d{10}$/.test(bankConfig.account_number.trim())) {
        setBankSaveState({ status: 'error', message: 'Account number must be exactly 10 digits.' });
        return;
      }
      if (!bankConfig.account_name?.trim()) {
        setBankSaveState({ status: 'error', message: 'Account name is required when bank transfer is enabled.' });
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/settings/bank-account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: bankConfig.bank_name?.trim() || null,
          account_number: bankConfig.account_number?.trim() || null,
          account_name: bankConfig.account_name?.trim() || null,
          transfer_instructions: bankConfig.transfer_instructions?.trim() || null,
          is_enabled: bankConfig.is_enabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBankSaveState({ status: 'error', message: data.error || 'Failed to save settings.' });
        return;
      }

      setBankSaveState({
        status: 'success',
        message: data.demo_mode
          ? 'Settings saved (demo mode — connect Supabase to persist).'
          : 'Bank account configuration saved and audit log written.',
      });

      // Refresh from server to confirm
      await fetchBankConfig();
      setTimeout(() => setBankSaveState({ status: 'idle', message: null }), 4000);
    } catch (err) {
      setBankSaveState({ status: 'error', message: 'Network error. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-surface-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Platform Configuration & Settings
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Configure your corporate bank transfer details and platform settings. All changes are
          audit-logged.
        </p>
        {demoMode && (
          <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Demo Mode:</strong> Supabase is not connected. Settings display only — connect
              Supabase to persist changes.
            </span>
          </div>
        )}
      </div>

      {/* ── Bank Transfer Configuration ───────────────────────────────────── */}
      <form onSubmit={handleBankConfigSave} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-surface-900">
                Bank Transfer Payment Configuration
              </h3>
            </div>
            {/* Enable / Disable toggle */}
            <button
              type="button"
              onClick={() => setBankConfig((p) => ({ ...p, is_enabled: !p.is_enabled }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                bankConfig.is_enabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-surface-100 text-surface-500 border border-surface-200'
              }`}
            >
              {bankConfig.is_enabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Bank Transfer: Enabled
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Bank Transfer: Disabled
                </>
              )}
            </button>
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800">
            <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Owner-Configured Account — Never Hardcoded</p>
              <p>
                These are YOUR platform's receiving bank account details. Enter your own business
                bank account number. These details will be displayed to users on the pricing page
                when they choose the Bank Transfer payment method. All changes are recorded in the
                audit log with your admin identity and timestamp.
              </p>
            </div>
          </div>

          {!bankConfig.is_enabled && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Bank transfer is currently <strong>disabled</strong>. Users will only see the
                Paystack card payment option. Enable this once you have configured your bank account
                details below.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required={bankConfig.is_enabled}
                value={bankConfig.bank_name || ''}
                onChange={(e) => setBankConfig((p) => ({ ...p, bank_name: e.target.value }))}
                placeholder="e.g. Zenith Bank, GTBank, Access Bank"
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1">
                Account Number (10 digits) <span className="text-red-500">*</span>
                <button
                  type="button"
                  onClick={() => setShowAccountNumber((v) => !v)}
                  className="ml-auto text-surface-400 hover:text-surface-600"
                  title={showAccountNumber ? 'Hide' : 'Show'}
                >
                  {showAccountNumber ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </label>
              <input
                type={showAccountNumber ? 'text' : 'password'}
                required={bankConfig.is_enabled}
                value={bankConfig.account_number || ''}
                onChange={(e) =>
                  setBankConfig((p) => ({ ...p, account_number: e.target.value.replace(/\D/g, '') }))
                }
                placeholder="10-digit Nigerian bank account number"
                maxLength={10}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-[11px] text-surface-400 mt-0.5">
                {(bankConfig.account_number || '').length}/10 digits
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Account Name (as shown on bank app) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required={bankConfig.is_enabled}
              value={bankConfig.account_name || ''}
              onChange={(e) => setBankConfig((p) => ({ ...p, account_name: e.target.value }))}
              placeholder="e.g. JobNexa Technologies Ltd"
              className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Payment Instructions (shown to users)
            </label>
            <textarea
              rows={3}
              value={bankConfig.transfer_instructions || ''}
              onChange={(e) =>
                setBankConfig((p) => ({ ...p, transfer_instructions: e.target.value }))
              }
              placeholder="Instructions shown to users on the payment page..."
              className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Save state feedback */}
          {bankSaveState.status === 'success' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{bankSaveState.message}</span>
            </div>
          )}
          {bankSaveState.status === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{bankSaveState.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={bankSaveState.status === 'saving'}
            className="px-8 py-3 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            {bankSaveState.status === 'saving' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Bank Account Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Subscription Pricing (read-only display) ─────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-surface-100">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-surface-900">Subscription Pricing</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              All-Access Fee
            </label>
            <div className="px-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl font-mono">
              ₦3,500.00
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Duration
            </label>
            <div className="px-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl font-mono">
              30 Days
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Auto-Renewal
            </label>
            <div className="px-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl">
              Disabled (V1 — One-time only)
            </div>
          </div>
        </div>
        <p className="text-[11px] text-surface-400">
          Pricing is fixed per PRD. Contact the development team to modify subscription amounts.
        </p>
      </div>
    </div>
  );
}
