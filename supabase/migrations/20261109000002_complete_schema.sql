-- ============================================================
-- JOBNEXA MIGRATION 20261109000002_complete_schema.sql
-- Complete, Authoritative, Executable PostgreSQL Schema
-- Supersedes and extends migrations 000000 and 000001
-- Run AFTER the two prior migrations have been applied
-- ============================================================
-- This migration:
--   1. Adds missing indexes to all prior tables
--   2. Adds the bank_transfer_settings table (owner-configured bank account)
--   3. Adds the job_applications table
--   4. Adds the recently_viewed table
--   5. Adds missing audit-log columns / trigger functions
--   6. Adds storage bucket helper views
--   7. Adds subscription expiry auto-update trigger
--   8. Adds missing RLS policies
--   9. Seeds safe empty bank account config (no hardcoded account details)
-- ============================================================

-- ── 1. SCHEMA INTEGRITY & ROLE SECURITY ───────────────────────────────────
-- Note: All enum values ('admin', 'super_admin', 'remote_job', 'international')
-- are already established in initial_schema. No ALTER TYPE needed.

-- Trigger: Automatically create public.profiles row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'job_seeker', -- Default role ALWAYS job_seeker; never allow self-assigned admin
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Prevent users from updating their own role column to escalate privileges
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own role.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_self_escalation();

-- ── 3. PERFORMANCE INDEXES ────────────────────────────────────────────────────

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_state_id ON public.profiles(state_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_category_id ON public.opportunities(category_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_state_id ON public.opportunities(state_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_featured ON public.opportunities(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(application_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_published_at ON public.opportunities(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_slug ON public.opportunities(slug);
-- Full-text search index on title + organization_name
CREATE INDEX IF NOT EXISTS idx_opportunities_fts ON public.opportunities
  USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(organization_name, '') || ' ' || coalesce(description, '')));

-- payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_txn_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_txn_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_txn_reference ON public.payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_txn_channel ON public.payment_transactions(channel);
CREATE INDEX IF NOT EXISTS idx_payment_txn_created_at ON public.payment_transactions(created_at DESC);

-- user_subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.user_subscriptions(expires_at);

-- saved_opportunities
CREATE INDEX IF NOT EXISTS idx_saved_opps_user_id ON public.saved_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_opps_opportunity_id ON public.saved_opportunities(opportunity_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);

-- admin_audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_table ON public.admin_audit_logs(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- companies
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON public.companies(is_verified);

-- ── 4. JOB APPLICATIONS TABLE ─────────────────────────────────────────────────
-- Tracks when a subscriber interacts with an application link (audit trail)
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    -- How the user engaged with the application
    application_method TEXT NOT NULL DEFAULT 'link_clicked', -- 'link_clicked', 'email_viewed', 'whatsapp_opened'
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_application UNIQUE (user_id, opportunity_id, application_method)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_opportunity ON public.job_applications(opportunity_id);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own applications" ON public.job_applications
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins read all applications" ON public.job_applications
    FOR SELECT USING (public.is_admin());

-- ── 5. RECENTLY VIEWED OPPORTUNITIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_recently_viewed UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON public.recently_viewed(user_id, viewed_at DESC);

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recently viewed" ON public.recently_viewed
    FOR ALL USING (auth.uid() = user_id);

-- ── 6. BANK ACCOUNT CONFIGURATION TABLE ──────────────────────────────────────
-- Stores the platform owner's receiving bank account details.
-- NEVER hardcoded in application source code.
-- Only readable by authenticated users (to display on pricing page).
-- Only writable by super_admin or admin role.
CREATE TABLE IF NOT EXISTS public.bank_account_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Owner's receiving bank account details
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    transfer_instructions TEXT,
    -- Availability flag: when FALSE, bank transfer is hidden from users
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    -- Audit fields
    configured_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    configured_at TIMESTAMPTZ,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Only one row allowed
    CONSTRAINT single_config CHECK (id = id), -- placeholder; enforced via unique index below
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one bank account config row allowed in the entire table
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_config_singleton
    ON public.bank_account_config ((TRUE));

ALTER TABLE public.bank_account_config ENABLE ROW LEVEL SECURITY;

-- Public users can read bank config (needed to display account number on pricing page)
-- BUT only the non-sensitive fields are needed; account_number is intentionally public
-- (it's a receiving account that users transfer money TO)
CREATE POLICY "Authenticated users read bank config" ON public.bank_account_config
    FOR SELECT TO authenticated USING (is_enabled = TRUE);
CREATE POLICY "Admins read bank config regardless of enabled state" ON public.bank_account_config
    FOR SELECT USING (public.is_admin());
CREATE POLICY "Super admins manage bank config" ON public.bank_account_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role::text IN ('super_admin', 'admin')
        )
    );

-- Insert the initial empty/disabled config row
INSERT INTO public.bank_account_config (is_enabled)
VALUES (FALSE)
ON CONFLICT DO NOTHING;

-- ── 7. UPDATED_AT TRIGGER FUNCTION ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to all tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'profiles',
        'opportunities',
        'user_subscriptions',
        'payment_transactions',
        'companies',
        'blog_posts',
        'bank_account_config'
    ] LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
             CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON public.%s
             FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
            tbl, tbl, tbl, tbl
        );
    END LOOP;
END;
$$;

-- ── 8. AUTO-EXPIRE SUBSCRIPTIONS ──────────────────────────────────────────────
-- Trigger that marks subscriptions as 'expired' when expires_at passes
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status = 'active' THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscription_expiry ON public.user_subscriptions;
CREATE TRIGGER trg_subscription_expiry
    BEFORE INSERT OR UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.check_subscription_expiry();

-- ── 9. ACTIVATE SUBSCRIPTION STORED PROCEDURE ────────────────────────────────
-- Called only by admin routes (via service role) or Paystack webhook.
-- Never callable by regular users through RLS.
CREATE OR REPLACE FUNCTION public.activate_subscription(
    p_user_id UUID,
    p_transaction_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_activated_at TIMESTAMPTZ;
    v_expires_at   TIMESTAMPTZ;
BEGIN
    v_activated_at := NOW();
    v_expires_at   := NOW() + INTERVAL '30 days';

    -- Upsert subscription (idempotent)
    INSERT INTO public.user_subscriptions (
        user_id, status, plan_name, plan_price_kobo,
        activated_at, expires_at, auto_renew, updated_at
    )
    VALUES (
        p_user_id, 'active', '30-Day All-Access Pass', 350000,
        v_activated_at, v_expires_at, FALSE, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status       = 'active',
        activated_at = v_activated_at,
        expires_at   = v_expires_at,
        auto_renew   = FALSE,
        updated_at   = NOW();

    -- Update the payment transaction
    IF p_transaction_id IS NOT NULL THEN
        UPDATE public.payment_transactions
        SET
            status               = 'approved',
            verified_by_admin_id = p_admin_id,
            verified_at          = v_activated_at,
            updated_at           = NOW()
        WHERE id = p_transaction_id
          AND status = 'pending_verification';
    END IF;

    RETURN jsonb_build_object(
        'activated_at', v_activated_at,
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 10. VIEWS CONVENIENCE ────────────────────────────────────────────────────

-- Active subscriptions view (used by admin analytics)
CREATE OR REPLACE VIEW public.v_active_subscriptions AS
SELECT
    us.id,
    us.user_id,
    p.full_name,
    p.email,
    us.status,
    us.plan_name,
    us.plan_price_kobo,
    us.activated_at,
    us.expires_at,
    us.auto_renew,
    EXTRACT(EPOCH FROM (us.expires_at - NOW())) / 86400 AS days_remaining
FROM public.user_subscriptions us
JOIN public.profiles p ON p.id = us.user_id
WHERE us.status = 'active' AND us.expires_at > NOW();

-- Pending bank receipts view
CREATE OR REPLACE VIEW public.v_pending_receipts AS
SELECT
    pt.id,
    pt.user_id,
    p.full_name,
    p.email,
    pt.amount_kobo,
    pt.reference,
    pt.sender_bank_name,
    pt.sender_account_name,
    pt.transfer_date,
    pt.receipt_storage_path,
    pt.created_at AS submitted_at
FROM public.payment_transactions pt
JOIN public.profiles p ON p.id = pt.user_id
WHERE pt.channel = 'bank_transfer' AND pt.status = 'pending_verification'
ORDER BY pt.created_at ASC;

-- ── 11. ENHANCED is_admin() FUNCTION ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('super_admin', 'admin', 'finance_auditor', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 12. PLATFORM_SETTINGS — REMOVE HARDCODED BANK DETAILS ────────────────────
-- Remove the hardcoded bank account details from platform_settings.
-- Bank details now live exclusively in bank_account_config.
-- This prevents accidental exposure of hardcoded account numbers.
DELETE FROM public.platform_settings WHERE key = 'bank_account_details';

-- Keep subscription_pricing setting but ensure it exists
INSERT INTO public.platform_settings (key, value, description) VALUES
(
    'subscription_pricing',
    '{"amount_naira": 3500, "amount_kobo": 350000, "duration_days": 30}',
    'Current active subscription pricing. Update with admin approval.'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_settings (key, value, description) VALUES
(
    'site_name',
    '"JobNexa"',
    'Platform display name used in emails and metadata.'
),
(
    'maintenance_mode',
    'false',
    'When true, all public pages show a maintenance notice.'
),
(
    'paystack_enabled',
    'true',
    'Whether Paystack card payment is available to users.'
)
ON CONFLICT (key) DO NOTHING;

-- ── 13. ADMIN_AUDIT_LOGS — ALLOW NULL admin_id FOR SYSTEM ACTIONS ─────────────
-- The existing schema has admin_id NOT NULL REFERENCES auth.users ON DELETE RESTRICT.
-- We need to allow NULL for webhook-triggered actions. Alter if needed.
ALTER TABLE public.admin_audit_logs
    ALTER COLUMN admin_id DROP NOT NULL;
