import { createServerSupabaseClient } from './supabase/server';
import { UserSubscription, UserProfile } from '@/types/database';

export interface AuthSessionData {
  user: UserProfile | null;
  subscription: UserSubscription | null;
  isActiveMember: boolean;
}

/**
 * Server-side helper to get the current authenticated user and their 30-day membership status.
 */
export async function getServerAuthSession(): Promise<AuthSessionData> {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Fetch subscription
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const isActive = Boolean(
          subscription &&
          subscription.status === 'active' &&
          subscription.expires_at &&
          new Date(subscription.expires_at) > new Date()
        );

        return {
          user: (profile as UserProfile) || null,
          subscription: (subscription as UserSubscription) || null,
          isActiveMember: isActive,
        };
      }
    }
  } catch (err) {
    console.warn('Supabase auth session check fallback:', err);
  }

  // Default guest session
  return {
    user: null,
    subscription: null,
    isActiveMember: false,
  };
}
