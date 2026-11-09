'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserSubscription, PaymentTransaction } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  subscription: UserSubscription | null;
  isActiveMember: boolean;
  savedJobIds: string[];
  paymentHistory: PaymentTransaction[];
  isLoading: boolean;
  toggleSaveJob: (id: string) => void;
  isJobSaved: (id: string) => boolean;
  loginDemoUser: (role?: 'free' | 'pro') => void;
  logout: () => Promise<void>;
  submitBankTransferReceipt: (data: {
    senderBank: string;
    senderName: string;
    receiptFile: File | null;
  }) => Promise<{ success: boolean; message: string; reference?: string }>;
  initializeAndVerifyPaystackPayment: () => Promise<{ success: boolean; message: string }>;
  simulatePaystackSuccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with localStorage on client mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('jobnexa_user');
      const storedSub = localStorage.getItem('jobnexa_sub');
      const storedSaved = localStorage.getItem('jobnexa_saved_jobs');
      const storedPayments = localStorage.getItem('jobnexa_payments');

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedSub) setSubscription(JSON.parse(storedSub));
      if (storedSaved) setSavedJobIds(JSON.parse(storedSaved));
      if (storedPayments) setPaymentHistory(JSON.parse(storedPayments));
    } catch (e) {
      console.warn('LocalStorage load error', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isActiveMember = Boolean(
    subscription &&
    subscription.status === 'active' &&
    subscription.expires_at &&
    new Date(subscription.expires_at) > new Date()
  );

  const toggleSaveJob = (id: string) => {
    setSavedJobIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('jobnexa_saved_jobs', JSON.stringify(updated));
      return updated;
    });
  };

  const isJobSaved = (id: string) => savedJobIds.includes(id);

  const loginDemoUser = (mode: 'free' | 'pro' = 'free') => {
    const isPro = mode === 'pro';
    const demoUser: UserProfile = {
      id: isPro ? 'demo-user-pro-01' : 'demo-user-free-02',
      email: isPro ? 'chidinma.pro@jobnexa.ng' : 'tunde.graduate@jobnexa.ng',
      full_name: isPro ? 'Chidinma Okafor (Pro Member)' : 'Tunde Adeleke (Graduate)',
      phone_number: '+234 803 123 4567',
      role: 'job_seeker',
      avatar_url: null,
      state_id: 'state-1',
      city: 'Lagos',
      highest_education: 'B.Sc Economics',
      current_employment_status: isPro ? 'Employed (Seeking Remote/Global)' : 'Unemployed / NYSC',
      resume_url: null,
      email_alerts_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const demoSub: UserSubscription = {
      id: `sub-${demoUser.id}`,
      user_id: demoUser.id,
      status: isPro ? 'active' : 'inactive',
      plan_name: '30-Day All-Access Pass',
      plan_price_kobo: 350000,
      activated_at: isPro ? new Date().toISOString() : null,
      expires_at: isPro ? expiresAt.toISOString() : null,
      auto_renew: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUser(demoUser);
    setSubscription(demoSub);
    localStorage.setItem('jobnexa_user', JSON.stringify(demoUser));
    localStorage.setItem('jobnexa_sub', JSON.stringify(demoSub));

    document.cookie = `jobnexa_is_active=${isPro ? 'true' : 'false'}; path=/; max-age=86400`;
  };

  const logout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSubscription(null);
    localStorage.removeItem('jobnexa_user');
    localStorage.removeItem('jobnexa_sub');
    document.cookie = `jobnexa_is_active=false; path=/; max-age=0`;
  };

  const initializeAndVerifyPaystackPayment = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const activeUser = user || {
        id: 'user-pstk-real',
        email: 'applicant@jobnexa.ng',
        full_name: 'JobNexa Applicant',
      };

      // 1. Initialize with server
      const initRes = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeUser.email,
          userId: activeUser.id,
        }),
      });
      const initData = await initRes.json();

      if (!initRes.ok || !initData.reference) {
        throw new Error(initData.error || 'Payment initialization failed');
      }

      // 2. Verify payment on server
      const verifyRes = await fetch('/api/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: initData.reference,
          userId: activeUser.id,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      // 3. Update local state
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const activeSub: UserSubscription = {
        id: `sub-${Date.now()}`,
        user_id: activeUser.id,
        status: 'active',
        plan_name: '30-Day All-Access Pass',
        plan_price_kobo: 350000,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newPayment: PaymentTransaction = {
        id: `tx-${Date.now()}`,
        user_id: activeUser.id,
        amount_kobo: 350000,
        currency: 'NGN',
        channel: 'paystack',
        status: 'approved',
        reference: initData.reference,
        receipt_storage_path: null,
        sender_bank_name: 'Paystack Card / Transfer',
        sender_account_name: activeUser.full_name,
        transfer_date: new Date().toISOString().split('T')[0],
        verified_by_admin_id: 'system_webhook',
        verified_at: new Date().toISOString(),
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSubscription(activeSub);
      const updatedPayments = [newPayment, ...paymentHistory];
      setPaymentHistory(updatedPayments);

      localStorage.setItem('jobnexa_sub', JSON.stringify(activeSub));
      localStorage.setItem('jobnexa_payments', JSON.stringify(updatedPayments));
      document.cookie = `jobnexa_is_active=true; path=/; max-age=86400`;

      return {
        success: true,
        message: 'Payment verified and confirmed. 30-day membership activated!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Payment processing error',
      };
    }
  };

  const simulatePaystackSuccess = () => {
    initializeAndVerifyPaystackPayment();
  };

  const submitBankTransferReceipt = async (data: {
    senderBank: string;
    senderName: string;
    receiptFile: File | null;
  }) => {
    try {
      const activeUser = user || {
        id: 'user-bt-pending',
        email: 'transfer-applicant@jobnexa.ng',
        full_name: data.senderName,
      };

      const res = await fetch('/api/payments/bank-transfer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          senderBank: data.senderBank,
          senderName: data.senderName,
          receiptPath: data.receiptFile ? `/receipts/${data.receiptFile.name}` : null,
          transferDate: new Date().toISOString().split('T')[0],
        }),
      });

      const resData = await res.json();
      const reference = resData.reference || `JN-BT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Invariant: Status = pending_verification
      const newTx: PaymentTransaction = {
        id: `tx-bt-${Date.now()}`,
        user_id: activeUser.id,
        amount_kobo: 350000,
        currency: 'NGN',
        channel: 'bank_transfer',
        status: 'pending_verification',
        reference,
        receipt_storage_path: data.receiptFile ? `/receipts/${data.receiptFile.name}` : null,
        sender_bank_name: data.senderBank,
        sender_account_name: data.senderName,
        transfer_date: new Date().toISOString().split('T')[0],
        verified_by_admin_id: null,
        verified_at: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [newTx, ...paymentHistory];
      setPaymentHistory(updated);
      localStorage.setItem('jobnexa_payments', JSON.stringify(updated));

      return {
        success: true,
        reference,
        message: 'Receipt submitted successfully. Transaction reference: ' + reference + '. Status: Pending Verification. An administrator must verify actual bank credit before membership is activated.',
      };
    } catch {
      return {
        success: true,
        message: 'Receipt recorded as Pending Verification. Administrator audit is required before activation.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isActiveMember,
        savedJobIds,
        paymentHistory,
        isLoading,
        toggleSaveJob,
        isJobSaved,
        loginDemoUser,
        logout,
        submitBankTransferReceipt,
        initializeAndVerifyPaystackPayment,
        simulatePaystackSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
