-- ====================================================================
-- JOBNEXA MIGRATION 20261109000000_initial_schema.sql
-- Production Schema for JobNexa (Nigerian Jobs & Opportunities Platform)
-- ====================================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM (
    'job_seeker',
    'employer',
    'moderator',
    'finance_auditor',
    'admin',
    'super_admin'
);

CREATE TYPE subscription_status AS ENUM (
    'inactive',
    'pending_verification',
    'active',
    'expired',
    'cancelled'
);

CREATE TYPE payment_channel AS ENUM (
    'paystack',
    'bank_transfer',
    'manual_admin_grant'
);

CREATE TYPE transaction_status AS ENUM (
    'pending_verification',
    'approved',
    'rejected',
    'refunded'
);

CREATE TYPE opportunity_type AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'nysc_ppa',
    'graduate_trainee',
    'internship',
    'scholarship',
    'fellowship',
    'grant',
    'vocational_training',
    'remote_job',
    'international'
);

CREATE TYPE opportunity_status AS ENUM (
    'draft',
    'pending_review',
    'published',
    'archived',
    'expired'
);

CREATE TYPE workplace_policy AS ENUM (
    'on_site',
    'hybrid',
    'remote_nigeria',
    'remote_global'
);

-- 2. TAXONOMY TABLES
CREATE TABLE IF NOT EXISTS public.locations_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    geopolitical_zone TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role user_role NOT NULL DEFAULT 'job_seeker',
    avatar_url TEXT,
    state_id UUID REFERENCES public.locations_states(id) ON DELETE SET NULL,
    city TEXT,
    highest_education TEXT,
    current_employment_status TEXT,
    resume_url TEXT,
    email_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    organization_name TEXT NOT NULL,
    organization_logo_url TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    state_id UUID REFERENCES public.locations_states(id) ON DELETE SET NULL,
    city TEXT,
    workplace_policy workplace_policy NOT NULL DEFAULT 'on_site',
    opportunity_type opportunity_type NOT NULL DEFAULT 'full_time',
    experience_level TEXT,
    salary_or_stipend_range TEXT,
    
    -- Public Discoverable Content (Free to View)
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    benefits TEXT,
    application_deadline TIMESTAMPTZ,
    
    -- Locked Private Content (Requires Active 30-Day Subscription)
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    employer_email TEXT,
    employer_phone TEXT,
    application_url TEXT,
    application_instructions TEXT,
    
    -- Status and Moderation
    status opportunity_status NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. USER SUBSCRIPTIONS (30-day non-recurring)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status subscription_status NOT NULL DEFAULT 'inactive',
    plan_name TEXT NOT NULL DEFAULT '30-Day All-Access Pass',
    plan_price_kobo BIGINT NOT NULL DEFAULT 350000, -- ₦3,500.00
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- 6. PAYMENT TRANSACTIONS & BANK RECEIPT AUDIT
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_kobo BIGINT NOT NULL DEFAULT 350000,
    currency TEXT NOT NULL DEFAULT 'NGN',
    channel payment_channel NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending_verification',
    reference TEXT NOT NULL UNIQUE,
    receipt_storage_path TEXT,
    sender_bank_name TEXT,
    sender_account_name TEXT,
    transfer_date DATE,
    verified_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SAVED OPPORTUNITIES & BOOKMARKS
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_saved_opportunity UNIQUE (user_id, opportunity_id)
);

-- 8. IMMUTABLE ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PLATFORM CONFIGURATION & SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('super_admin', 'admin', 'finance_auditor', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Public read states" ON public.locations_states FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone read published opportunities" ON public.opportunities FOR SELECT USING (status = 'published');
CREATE POLICY "Admins full manage opportunities" ON public.opportunities FOR ALL USING (public.is_admin());

CREATE POLICY "Users view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins full manage subscriptions" ON public.user_subscriptions FOR ALL USING (public.is_admin());

CREATE POLICY "Users view own transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create pending transfer receipts" ON public.payment_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id AND channel = 'bank_transfer' AND status = 'pending_verification');
CREATE POLICY "Admins manage transactions" ON public.payment_transactions FOR ALL USING (public.is_admin());

CREATE POLICY "Users manage saved opportunities" ON public.saved_opportunities FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read public settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.platform_settings FOR ALL USING (public.is_admin());
