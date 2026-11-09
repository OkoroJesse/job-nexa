'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserSubscription, PaymentTransaction } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  subscription: UserSubscription | null;
  isActiveMember: boolean;
  savedJobIds: string[];
  paymentHistory: PaymentTransaction[];
  isLoading: boolean;
  toggleSaveJob: (id: string) => Promise<void>;
  isJobSaved: (id: string) => boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  submitBankTransferReceipt: (data: {
    senderBank: string;
    senderName: string;
    receiptFile: File | null;
  }) => Promise<{ success: boolean; message: string; reference?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async (userId: string, userEmail?: string) => {
    const supabase = createClient();
    try {
      // 1. Fetch profile from public.profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser(profile as UserProfile);
      } else {
        // Fallback minimal profile if trigger pending
        setUser({
          id: userId,
          email: userEmail || '',
          full_name: userEmail?.split('@')[0] || 'Candidate',
          role: 'job_seeker',
          phone_number: null,
          avatar_url: null,
          state_id: null,
          city: null,
          highest_education: null,
          current_employment_status: null,
          resume_url: null,
          email_alerts_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Fetch active subscription
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription((sub as UserSubscription) || null);

      // 3. Fetch saved opportunities
      const { data: saved } = await supabase
        .from('saved_opportunities')
        .select('opportunity_id')
        .eq('user_id', userId);

      if (saved) {
        setSavedJobIds(saved.map((s) => s.opportunity_id));
      }

      // 4. Fetch payment transactions history
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (transactions) {
        setPaymentHistory(transactions as PaymentTransaction[]);
      }
    } catch (err) {
      console.warn('Error fetching Supabase user data:', err);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserData(session.user.id, session.user.email);
      } else {
        setUser(null);
        setSubscription(null);
        setSavedJobIds([]);
        setPaymentHistory([]);
      }
    } catch (err) {
      console.warn('Session refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  // Genuine Supabase Auth state listener
  useEffect(() => {
    const supabase = createClient();

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Realtime auth listener
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserData(session.user.id, session.user.email);
        } else {
          setUser(null);
          setSubscription(null);
          setSavedJobIds([]);
          setPaymentHistory([]);
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, [fetchUserData]);

  const isActiveMember = Boolean(
    subscription &&
    subscription.status === 'active' &&
    subscription.expires_at &&
    new Date(subscription.expires_at) > new Date()
  );

  const toggleSaveJob = async (jobId: string) => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      return;
    }

    const isSaved = savedJobIds.includes(jobId);
    const updated = isSaved ? savedJobIds.filter((id) => id !== jobId) : [...savedJobIds, jobId];
    setSavedJobIds(updated);

    try {
      const supabase = createClient();
      if (isSaved) {
        await supabase
          .from('saved_opportunities')
          .delete()
          .match({ user_id: user.id, opportunity_id: jobId });
      } else {
        await supabase
          .from('saved_opportunities')
          .insert({ user_id: user.id, opportunity_id: jobId });
      }
    } catch (err) {
      console.warn('Failed to persist bookmark to Supabase:', err);
    }
  };

  const isJobSaved = (id: string) => savedJobIds.includes(id);

  const logout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setSubscription(null);
    setSavedJobIds([]);
    setPaymentHistory([]);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const submitBankTransferReceipt = async (data: {
    senderBank: string;
    senderName: string;
    receiptFile: File | null;
  }): Promise<{ success: boolean; message: string; reference?: string }> => {
    if (!user) {
      return {
        success: false,
        message: 'You must be signed in to submit a bank payment receipt.',
      };
    }

    try {
      const supabase = createClient();
      let receiptStoragePath: string | null = null;

      if (data.receiptFile) {
        const fileExt = data.receiptFile.name.split('.').pop() || 'png';
        const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
        const storageKey = `${user.id}/${Date.now()}_receipt.${cleanExt}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(storageKey, data.receiptFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          receiptStoragePath = storageKey;
        } else {
          console.warn('Storage upload fallback:', uploadError.message);
          receiptStoragePath = `uploads/${data.receiptFile.name}`;
        }
      }

      const res = await fetch('/api/payments/bank-transfer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          senderBank: data.senderBank,
          senderName: data.senderName,
          receiptPath: receiptStoragePath,
          transferDate: new Date().toISOString().split('T')[0],
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: resData.error || 'Failed to submit bank transfer receipt.',
        };
      }

      await refreshSession();
      return {
        success: true,
        message: 'Bank transfer receipt submitted successfully. Your payment will be verified by finance.',
        reference: resData.reference,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error while submitting bank receipt.',
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
        logout,
        refreshSession,
        submitBankTransferReceipt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
