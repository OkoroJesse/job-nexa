-- ====================================================================
-- JOBNEXA MIGRATION 20261109000001_admin_and_business_system.sql
-- Complete Administrative, Content Management & Business System
-- ====================================================================

-- 1. COMPANIES & EMPLOYERS TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    website_url TEXT,
    industry TEXT,
    headquarters_city TEXT,
    headquarters_state_id UUID REFERENCES public.locations_states(id) ON DELETE SET NULL,
    official_email TEXT,
    official_phone TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_listings_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BLOG POSTS TABLE (Editorial CMS)
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Career Advice',
    cover_image_url TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT 'JobNexa Editorial Team',
    read_time_minutes INT NOT NULL DEFAULT 5,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means global announcement
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'subscription', 'job_alert', 'payment', 'system'
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUTHORIZED RSS & API SOURCES (Import Centre)
CREATE TABLE IF NOT EXISTS public.authorized_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'rss', -- 'rss', 'json_api', 'partner_api'
    endpoint_url TEXT NOT NULL UNIQUE,
    api_key_header TEXT,
    default_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_polled_at TIMESTAMPTZ,
    last_poll_status TEXT,
    total_imported_records INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ENABLE RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_sources ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
-- Companies: Public can read, Admins full manage
CREATE POLICY "Public read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Admins manage companies" ON public.companies FOR ALL USING (public.is_admin());

-- Blog Posts: Public can read published, Admins full manage
CREATE POLICY "Public read published blog posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage blog posts" ON public.blog_posts FOR ALL USING (public.is_admin());

-- Notifications: Users read own or global announcements
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT 
USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users update own notification read state" ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());
CREATE POLICY "Admins manage all notifications" ON public.notifications FOR ALL 
USING (public.is_admin());

-- Authorized Sources: Only Admins can view and manage
CREATE POLICY "Admins manage sources" ON public.authorized_sources FOR ALL 
USING (public.is_admin());

-- 7. REJECTION & AUDIT LOG STORED PROCEDURE FOR BANK TRANSFERS
CREATE OR REPLACE FUNCTION public.reject_bank_transfer_subscription(
    p_transaction_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_status transaction_status;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can reject bank receipts.';
    END IF;

    SELECT user_id, status INTO v_user_id, v_status
    FROM public.payment_transactions
    WHERE id = p_transaction_id FOR UPDATE;

    IF v_status != 'pending_verification' THEN
        RAISE EXCEPTION 'Invalid State: Transaction is not in pending_verification state.';
    END IF;

    -- Update Transaction
    UPDATE public.payment_transactions
    SET 
        status = 'rejected',
        verified_by_admin_id = p_admin_id,
        verified_at = NOW(),
        rejection_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_transaction_id;

    -- Create In-App Notification for User
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        action_url
    ) VALUES (
        v_user_id,
        'Bank Transfer Verification Update',
        'Your payment receipt was reviewed and rejected. Reason: ' || p_reason,
        'payment',
        '/pricing'
    );

    -- Log Immutable Audit
    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        target_table,
        target_id,
        new_state
    ) VALUES (
        p_admin_id,
        'reject_bank_receipt',
        'payment_transactions',
        p_transaction_id,
        json_build_object('user_id', v_user_id, 'reason', p_reason, 'rejected_at', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
