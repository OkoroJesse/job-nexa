# JobNexa — Complete Supabase Database Setup Guide
**Author:** DevOps & Database Engineering  
**Version:** 2.0 (PostgreSQL Schema & Security Architecture)  
**Date:** 2026-11-09  

---

## 1. Overview & Architecture

JobNexa relies on Supabase for four foundational tiers:
1. **PostgreSQL Relational Database:** Enforces data integrity, foreign key cascades, uniqueness invariants, and custom plpgsql functions.
2. **Row Level Security (RLS):** Prevents unpaid users from accessing private recruiter contacts and shields administrative endpoints at the database engine level.
3. **Supabase Auth:** Authenticates job seekers, administrators, and employers with JWT session tokens stored in secure HTTP-only cookies.
4. **Supabase Storage:** Manages private payment proof receipts and publicly accessible employer branding logos.

---

## 2. Step 1: Create Your Supabase Project

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **"New project"** and select your desired organization.
3. Configure the project:
   - **Name:** `jobnexa-production` (or `jobnexa-staging`)
   - **Database Password:** Generate a secure, 32-character random string and save it in your team's password vault.
   - **Region:** Select **Europe (London - eu-west-2)** or **Europe (Frankfurt - eu-central-1)** to provide minimal latency to West African and international connections.
   - **Pricing Plan:** Free tier for development/staging; Pro plan recommended for production to enable automated daily backups, point-in-time recovery (PITR), and increased compute resources.
4. Click **"Create new project"**. Provisioning takes approximately 90–120 seconds.

---

## 3. Step 2: Where to Find the SQL Editor

1. Open your project in the Supabase Dashboard.
2. In the left-hand navigation sidebar, click on the **SQL Editor** icon (represented by the `>_` terminal symbol).
3. Click **"+ New query"** in the top bar to open a clean SQL console.
4. When pasting migrations, ensure you run one complete migration at a time, check the execution status banner (green checkmark), and review output logs.

---

## 4. Step 3: Migration Execution Order

All migration files are located in the repository directory `supabase/migrations/`. They are strictly numbered and dependency-ordered.

> [!IMPORTANT]
> Always execute the migration scripts in the exact numerical sequence listed below. Never run migration scripts concurrently or out of order.

### Execution Sequence

```
Step 1: supabase/migrations/20261109000000_initial_schema.sql
        └── Custom ENUM types, core taxonomy tables, profiles, opportunities,
            subscriptions, transactions, bookmarks, audit logs, and initial RLS policies.

Step 2: supabase/migrations/20261109000001_admin_and_business_system.sql
        └── Companies, blog CMS, broadcast notifications, authorized import sources,
            and the reject_bank_transfer_subscription stored procedure.

Step 3: supabase/migrations/20261109000002_complete_schema.sql
        └── Owner-configured bank_account_config (never hardcoded), job_applications,
            recently_viewed, performance indexes, GIN full-text search, automatic
            subscription expiry triggers, and activate_subscription stored procedure.

Step 4: supabase/migrations/20261109000003_storage_buckets_and_policies.sql
        └── Storage buckets (payment-receipts, organization-logos, resumes) and
            their strict RLS access policies.

Step 5: supabase/migrations/20261109000004_initial_reference_seed_data.sql
        └── Seeds all 36 Nigerian States + FCT, 10 opportunity categories,
            platform settings, and initial authorized sources.
```

---

## 5. Step 4: Supabase Authentication Configuration

1. In the Supabase left sidebar, click **Authentication** (padlock icon) → **Configuration** → **URL Configuration**.
2. **Site URL:** Set to your public domain:
   - Development: `http://localhost:3000`
   - Production: `https://jobnexa.ng`
3. **Redirect URLs:** Add the following authorized callbacks:
   - `http://localhost:3000/**`
   - `https://jobnexa.ng/**`
   - `https://www.jobnexa.ng/**`
4. In **Authentication** → **Email Templates**:
   - Customize the Confirmation and Magic Link templates with JobNexa branding and support contact info.
5. In **Authentication** → **Providers** → **Email**:
   - Ensure "Enable Email provider" is switched **ON**.
   - For production, turn "Confirm email" **ON**. (In local testing, you may leave it off to test registrations instantly).

---

## 6. Step 5: Supabase Storage Buckets & Policies Verification

Once migration `20261109000003_storage_buckets_and_policies.sql` is executed, verify your storage configuration in **Storage** (folder icon in sidebar):

| Bucket Name | Visibility | File Size Limit | Allowed MIME Types | Purpose |
|---|---|---|---|---|
| `payment-receipts` | **Private** | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | User-submitted bank transfer payment proof screenshots and teller PDFs. |
| `organization-logos` | **Public** | 2 MB | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` | Company branding, bank emblems, scholarship foundation badges. |
| `resumes` | **Private** | 10 MB | `application/pdf`, `.doc`, `.docx` | Job seeker curriculum vitae. |

### Verification of Storage RLS
1. Navigate to **Storage** → **Policies**.
2. Confirm the policy `"Authenticated users upload own payment receipts"` exists on `storage.objects`.
3. Confirm unauthenticated public access to `payment-receipts` is completely blocked.

---

## 7. Step 6: Creating the First Administrator Securely

For security, the initial administrator cannot be created by direct registration with elevated privileges. Instead, bootstrap the account using this verified procedure:

1. Visit your deployed app or local environment at `/register`.
2. Register a new user account with your official administrative email address (e.g. `admin@jobnexa.ng`).
3. Complete email verification if enabled.
4. Go to your **Supabase Dashboard** → **SQL Editor**.
5. Execute the following promotion query:

```sql
-- 1. Find user ID and promote to super_admin
UPDATE public.profiles
SET 
    role = 'super_admin',
    full_name = 'JobNexa Systems Administrator'
WHERE email = 'admin@jobnexa.ng';

-- 2. Verify promotion
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE email = 'admin@jobnexa.ng';
```

6. Log in at `/login`. Your session will now pass the `middleware.ts` admin guard and grant access to `/admin` and all administrative API routes.

---

## 8. Step 7: Configuring Environment Variables

In your Next.js deployment (local `.env.local` or Vercel Environment Variables console), supply the following keys obtained from **Project Settings** → **API**:

```env
# ── SUPABASE CREDENTIALS ─────────────────────────────────────────
# Found in: Project Settings -> API -> Project URL
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co

# Found in: Project Settings -> API -> Project API Keys -> anon (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Found in: Project Settings -> API -> Project API Keys -> service_role (SECRET!)
# CRITICAL: Keep server-only. Never prefix with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ── PAYSTACK CREDENTIALS ─────────────────────────────────────────
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here

# ── UPSTASH REDIS RATE LIMITING ──────────────────────────────────
# Found in: Upstash Console -> Redis Database -> REST API
UPSTASH_REDIS_REST_URL=https://[YOUR_UPSTASH_INSTANCE].upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token_here

# ── APPLICATION URLS ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://jobnexa.ng
NEXT_PUBLIC_SITE_URL=https://jobnexa.ng
```

---

## 9. Step 8: Comprehensive Schema Verification Script

Copy and run this verification script in the Supabase SQL Editor. It performs a complete health audit of all tables, foreign keys, triggers, and Row Level Security statuses:

```sql
DO $$
DECLARE
    tbl TEXT;
    expected_tables TEXT[] := ARRAY[
        'profiles',
        'locations_states',
        'categories',
        'opportunities',
        'companies',
        'user_subscriptions',
        'payment_transactions',
        'saved_opportunities',
        'job_applications',
        'recently_viewed',
        'bank_account_config',
        'blog_posts',
        'notifications',
        'authorized_sources',
        'admin_audit_logs',
        'platform_settings'
    ];
    rls_enabled BOOLEAN;
    row_count INT;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'JOBNEXA DATABASE VERIFICATION AUDIT';
    RAISE NOTICE '==================================================';

    FOREACH tbl IN ARRAY expected_tables LOOP
        -- Check table exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            RAISE EXCEPTION 'CRITICAL: Table % is missing!', tbl;
        END IF;

        -- Check RLS is enabled
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = tbl AND relnamespace = 'public'::regnamespace;

        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'SECURITY ALERT: RLS is disabled on table %!', tbl;
        ELSE
            RAISE NOTICE '✓ Table public.% exists and has Row Level Security ENABLED', tbl;
        END IF;
    END LOOP;

    -- Verify states count
    SELECT COUNT(*) INTO row_count FROM public.locations_states;
    RAISE NOTICE '✓ Locations states count: % (Expected: 37 for 36 states + FCT)', row_count;

    -- Verify categories count
    SELECT COUNT(*) INTO row_count FROM public.categories;
    RAISE NOTICE '✓ Categories count: % (Expected: 10)', row_count;

    -- Verify bank config singleton
    SELECT COUNT(*) INTO row_count FROM public.bank_account_config;
    RAISE NOTICE '✓ Bank account config initialized: % row (Disabled by default)', row_count;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'AUDIT COMPLETED: All tables, constraints & RLS pass!';
    RAISE NOTICE '==================================================';
END;
$$;
```
