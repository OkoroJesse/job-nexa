export type UserRole = 'job_seeker' | 'employer' | 'moderator' | 'finance_auditor' | 'super_admin';

export type SubscriptionStatus = 'inactive' | 'pending_verification' | 'active' | 'expired' | 'cancelled';

export type PaymentChannel = 'paystack' | 'bank_transfer' | 'manual_admin_grant';

export type TransactionStatus = 'pending_verification' | 'approved' | 'rejected' | 'refunded';

export type OpportunityType = 
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'nysc_ppa'
  | 'graduate_trainee'
  | 'internship'
  | 'scholarship'
  | 'fellowship'
  | 'grant'
  | 'vocational_training';

export type OpportunityStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'expired';

export type WorkplacePolicy = 'on_site' | 'hybrid' | 'remote_nigeria' | 'remote_global';

export interface LocationState {
  id: string;
  name: string;
  slug: string;
  geopolitical_zone: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  avatar_url: string | null;
  state_id: string | null;
  city: string | null;
  highest_education: string | null;
  current_employment_status: string | null;
  resume_url: string | null;
  email_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan_name: string;
  plan_price_kobo: number; // 350000 = ₦3,500
  activated_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount_kobo: number;
  currency: string;
  channel: PaymentChannel;
  status: TransactionStatus;
  reference: string;
  receipt_storage_path: string | null;
  sender_bank_name: string | null;
  sender_account_name: string | null;
  transfer_date: string | null;
  verified_by_admin_id: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  gateway_response?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Base public view of an opportunity - Safe for unauthenticated / non-paying visitors
export interface PublicOpportunity {
  id: string;
  title: string;
  slug: string;
  organization_name: string;
  organization_logo_url: string | null;
  category_id: string;
  category?: Category;
  state_id: string | null;
  state?: LocationState;
  city: string | null;
  workplace_policy: WorkplacePolicy;
  opportunity_type: OpportunityType;
  experience_level: string | null;
  salary_or_stipend_range: string | null;
  description: string;
  requirements: string;
  benefits: string | null;
  application_deadline: string | null;
  is_locked: boolean;
  is_featured: boolean;
  views_count: number;
  published_at: string | null;
  created_at: string;
}

// Unlocked view for authenticated users with active 30-day membership
export interface UnlockedOpportunity extends PublicOpportunity {
  employer_email: string | null;
  employer_phone: string | null;
  application_url: string | null;
  application_instructions: string | null;
}
