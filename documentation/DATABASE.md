# Database Architecture & SQL Schema Document: JobNexa

**Database Engine:** PostgreSQL 15+ (Supabase Managed Cloud)  
**Schema Version:** 1.0.0  
**Target Architecture:** Strict Relational Integrity, Row-Level Security (RLS), JSONB Metadata, Time-Series Audit Trails  

---

## 1. Entity Relationship Overview

```
 ┌──────────────────────┐         1:1         ┌──────────────────────────┐
 │      auth.users      │ ◄─────────────────► │         profiles         │
 └──────────┬───────────┘                     └─────────────┬────────────┘
            │                                               │
            │ 1:N                                           │ 1:N
            ▼                                               ▼
 ┌──────────────────────┐                     ┌──────────────────────────┐
 │ payment_transactions │                     │   user_subscriptions     │
 └──────────────────────┘                     └──────────────────────────┘
            ▲                                               │
            │ (Audited by Admin)                            │ (Grants 30-Day Access)
            │                                               ▼
 ┌──────────────────────┐         1:N         ┌──────────────────────────┐
 │   admin_audit_logs   │                     │      opportunities       │
 └──────────────────────┘                     └─────────────┬────────────┘
                                                            │
                                         ┌──────────────────┴──────────────────┐
                                         │ N:1                                 │ N:1
                                         ▼                                     ▼
                              ┌──────────────────────┐              ┌──────────────────────┐
                              │   locations_states   │              │      categories      │
                              └──────────────────────┘              └──────────────────────┘
```

---

## 2. PostgreSQL Custom Types (Enums)

```sql
-- Role Hierarchy
CREATE TYPE user_role AS ENUM (
    'job_seeker',
    'employer',
    'moderator',
    'finance_auditor',
    'super_admin'
);

-- Subscription Status State Machine
CREATE TYPE subscription_status AS ENUM (
    'inactive',
    'pending_verification',
    'active',
    'expired',
    'cancelled'
);

-- Payment Channels
CREATE TYPE payment_channel AS ENUM (
    'paystack',
    'bank_transfer',
    'manual_admin_grant'
);

-- Transaction Status
CREATE TYPE transaction_status AS ENUM (
    'pending_verification',
    'approved',
    'rejected',
    'refunded'
);

-- Opportunity Types
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
    'vocational_training'
);

-- Opportunity Publication Status
CREATE TYPE opportunity_status AS ENUM (
    'draft',
    'pending_review',
    'published',
    'archived',
    'expired'
);

-- Workplace Policy
CREATE TYPE workplace_policy AS ENUM (
    'on_site',
    'hybrid',
    'remote_nigeria',
    'remote_global'
);
```

---

## 3. Core Table Definitions & Constraints

### 3.1 Profiles Table (Linked to `auth.users`)
```sql
CREATE TABLE public.profiles (
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
```

### 3.2 Geographic Taxonomy: Nigerian States & FCT
```sql
CREATE TABLE public.locations_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- e.g. 'Lagos', 'Abuja (FCT)', 'Kano', 'Rivers'
    slug TEXT NOT NULL UNIQUE,          -- e.g. 'lagos', 'abuja-fct', 'kano', 'rivers'
    geopolitical_zone TEXT NOT NULL,    -- 'North Central', 'North East', 'North West', 'South East', 'South South', 'South West'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.3 Opportunity Categories
```sql
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- e.g. 'Tech & Software', 'NYSC PPA', 'Graduate Trainee', 'Scholarships'
    slug TEXT NOT NULL UNIQUE,          -- e.g. 'tech-software', 'nysc-ppa', 'graduate-trainee'
    description TEXT,
    icon_name TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4 Opportunities Catalog (Core Content Table)
```sql
CREATE TABLE public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    organization_name TEXT NOT NULL,
    organization_logo_url TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    state_id UUID REFERENCES public.locations_states(id) ON DELETE SET NULL,
    city TEXT,                          -- e.g. 'Ikeja', 'Wuse II', 'Port Harcourt'
    workplace_policy workplace_policy NOT NULL DEFAULT 'on_site',
    opportunity_type opportunity_type NOT NULL DEFAULT 'full_time',
    experience_level TEXT,              -- 'Entry Level', 'Mid Level', 'Senior', 'No Experience'
    salary_or_stipend_range TEXT,       -- e.g. '₦150,000 - ₦250,000 / month' or '$1,500 / month'
    
    -- Public Discoverable Content (Free to Read & Indexed for SEO)
    description TEXT NOT NULL,          -- Markdown / Clean HTML
    requirements TEXT NOT NULL,         -- Qualifications, degree, skills
    benefits TEXT,
    application_deadline TIMESTAMPTZ,
    
    -- Gated / Locked Content (Requires Active ₦3,500 30-Day Subscription)
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    employer_email TEXT,                -- Private HR / Recruiter submission email
    employer_phone TEXT,                -- Verified HR WhatsApp / Phone
    application_url TEXT,               -- Direct corporate career link / form
    application_instructions TEXT,      -- Step-by-step guidance & required subject lines
    
    -- Administrative & Publishing Lifecycle
    status opportunity_status NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.5 User Subscriptions (30-Day Access Engine)
```sql
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status subscription_status NOT NULL DEFAULT 'inactive',
    plan_name TEXT NOT NULL DEFAULT '30-Day All-Access Pass',
    plan_price_kobo BIGINT NOT NULL DEFAULT 350000, -- ₦3,500.00 in Kobo
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,             -- Set to activated_at + interval '30 days'
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE, -- Strictly FALSE in V1
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);
```

### 3.6 Payment Transactions & Bank Receipt Auditing
```sql
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_kobo BIGINT NOT NULL DEFAULT 350000,   -- ₦3,500.00
    currency TEXT NOT NULL DEFAULT 'NGN',
    channel payment_channel NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending_verification',
    reference TEXT NOT NULL UNIQUE,               -- Paystack reference or system generated transfer ref
    
    -- Direct Bank Transfer Metadata
    receipt_storage_path TEXT,                    -- Path in private Supabase bucket
    sender_bank_name TEXT,                        -- e.g. 'GTBank', 'OPay', 'Kuda', 'Zenith'
    sender_account_name TEXT,
    transfer_date DATE,
    
    -- Admin Auditing Trail
    verified_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    gateway_response JSONB,                       -- Raw Paystack webhook response payload
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.7 Content Ingestion & Import Batches
```sql
CREATE TABLE public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,                    -- 'csv', 'json', 'raw_paste', 'rss_feed'
    total_records INT NOT NULL DEFAULT 0,
    successful_imports INT NOT NULL DEFAULT 0,
    failed_records INT NOT NULL DEFAULT 0,
    raw_payload_storage_path TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.8 Immutable Administrative Audit Log
```sql
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,                         -- 'approve_bank_receipt', 'reject_bank_receipt', 'publish_opportunity', 'override_subscription'
    target_table TEXT NOT NULL,                   -- 'payment_transactions', 'user_subscriptions', 'opportunities'
    target_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.9 Platform Configuration & Bank Details Settings
```sql
CREATE TABLE public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Default Settings
INSERT INTO public.platform_settings (key, value, description) VALUES
('bank_account_details', '{
    "bank_name": "Zenith Bank",
    "account_number": "1012345678",
    "account_name": "JobNexa Technologies Ltd",
    "instructions": "Transfer exactly ₦3,500. Use your registered phone number or email as the payment description."
}', 'Bank account displayed to users for manual transfer'),
('subscription_pricing', '{
    "amount_naira": 3500,
    "amount_kobo": 350000,
    "duration_days": 30
}', 'Current pricing configuration for standard membership');
```

---

## 4. Performance Indexes

```sql
-- Opportunities Indexes for High-Velocity Filtering
CREATE INDEX idx_opportunities_search ON public.opportunities USING gin(to_tsvector('english', title || ' ' || organization_name || ' ' || description));
CREATE INDEX idx_opportunities_state ON public.opportunities(state_id) WHERE status = 'published';
CREATE INDEX idx_opportunities_category ON public.opportunities(category_id) WHERE status = 'published';
CREATE INDEX idx_opportunities_type ON public.opportunities(opportunity_type) WHERE status = 'published';
CREATE INDEX idx_opportunities_featured ON public.opportunities(is_featured, created_at DESC) WHERE status = 'published';
CREATE INDEX idx_opportunities_slug ON public.opportunities(slug);

-- Payment & Subscription Indexes
CREATE INDEX idx_subscriptions_user_status ON public.user_subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_expires_at ON public.user_subscriptions(expires_at) WHERE status = 'active';
CREATE INDEX idx_transactions_status ON public.payment_transactions(status) WHERE status = 'pending_verification';
CREATE INDEX idx_transactions_ref ON public.payment_transactions(reference);
```

---

## 5. Row-Level Security (RLS) Policies

```sql
-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function to Check Admin Privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'finance_auditor', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT USING (public.is_admin());

-- 2. Opportunities Public Discovery Policy (Excluding Locked Contact Columns)
-- Note: Sensitive fields are masked in SQL Views or Server Components
CREATE POLICY "Anyone can view published opportunities" 
ON public.opportunities FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins manage all opportunities" 
ON public.opportunities FOR ALL 
USING (public.is_admin());

-- 3. Subscription Policies
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins view and manage all subscriptions" 
ON public.user_subscriptions FOR ALL 
USING (public.is_admin());

-- 4. Payment Transactions Policies
CREATE POLICY "Users can view their own transactions" 
ON public.payment_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert transfer receipts for themselves" 
ON public.payment_transactions FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND channel = 'bank_transfer' 
    AND status = 'pending_verification'
);

CREATE POLICY "Admins view and manage transactions" 
ON public.payment_transactions FOR ALL 
USING (public.is_admin());

-- 5. Platform Settings Policies
CREATE POLICY "Public read-only for public settings" 
ON public.platform_settings FOR SELECT 
TO public USING (TRUE);

CREATE POLICY "Admins update settings" 
ON public.platform_settings FOR ALL 
USING (public.is_admin());
```

---

## 6. Stored Procedures & Business Logic Triggers

### 6.1 Admin Verification & 30-Day Activation Function
```sql
CREATE OR REPLACE FUNCTION public.approve_bank_transfer_subscription(
    p_transaction_id UUID,
    p_admin_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_status transaction_status;
BEGIN
    -- Verify caller is an authorized admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can approve bank receipts.';
    END IF;

    -- Fetch transaction details
    SELECT user_id, status INTO v_user_id, v_status
    FROM public.payment_transactions
    WHERE id = p_transaction_id FOR UPDATE;

    IF v_status != 'pending_verification' THEN
        RAISE EXCEPTION 'Invalid State: Transaction is not in pending_verification state.';
    END IF;

    -- 1. Update Payment Transaction to Approved
    UPDATE public.payment_transactions
    SET 
        status = 'approved',
        verified_by_admin_id = p_admin_id,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = p_transaction_id;

    -- 2. Upsert User Subscription for Exactly 30 Days from NOW()
    INSERT INTO public.user_subscriptions (
        user_id,
        status,
        plan_name,
        plan_price_kobo,
        activated_at,
        expires_at,
        auto_renew,
        updated_at
    )
    VALUES (
        v_user_id,
        'active',
        '30-Day All-Access Pass',
        350000,
        NOW(),
        NOW() + INTERVAL '30 days',
        FALSE,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        activated_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days',
        auto_renew = FALSE,
        updated_at = NOW();

    -- 3. Log Immutable Audit Record
    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        target_table,
        target_id,
        new_state
    ) VALUES (
        p_admin_id,
        'approve_bank_receipt',
        'payment_transactions',
        p_transaction_id,
        json_build_object('user_id', v_user_id, 'approved_at', NOW(), 'expires_at', NOW() + INTERVAL '30 days')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
