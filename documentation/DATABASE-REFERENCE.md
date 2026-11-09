# JobNexa — Complete Database Reference & Security Specification
**Version:** 2.0 (PostgreSQL Architecture & RLS Matrix)  
**Date:** 2026-11-09  

---

## 1. Relational Entity Diagram Overview

```
auth.users (Supabase Identity)
    │
    ├── 1:1 ── public.profiles
    │            ├── N:1 ── public.locations_states
    │
    ├── 1:1 ── public.user_subscriptions
    │
    ├── 1:N ── public.payment_transactions
    │            └── N:1 ── auth.users (verified_by_admin_id)
    │
    ├── 1:N ── public.saved_opportunities ── N:1 ── public.opportunities
    │
    ├── 1:N ── public.job_applications ───── N:1 ── public.opportunities
    │
    ├── 1:N ── public.recently_viewed ────── N:1 ── public.opportunities
    │
    ├── 1:N ── public.notifications
    │
    └── 1:N ── public.admin_audit_logs

public.opportunities
    ├── N:1 ── public.categories
    ├── N:1 ── public.locations_states
    ├── N:1 ── public.companies (optional reference)
    └── N:1 ── auth.users (created_by)

public.bank_account_config (Singleton, Owner-Configured)
    └── N:1 ── auth.users (configured_by, updated_by)

public.platform_settings (Key-Value Store)
```

---

## 2. Comprehensive Table Catalog

### Table 1: `public.profiles`
- **Purpose:** Stores user profile metadata linked 1:1 with Supabase `auth.users(id)` via foreign key cascade.
- **Primary Key:** `id UUID` (matches `auth.users.id`).
- **Columns:**
  - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
  - `email TEXT NOT NULL UNIQUE`
  - `full_name TEXT NOT NULL`
  - `phone_number TEXT`
  - `role user_role NOT NULL DEFAULT 'job_seeker'` (Enum: `job_seeker`, `employer`, `moderator`, `finance_auditor`, `admin`, `super_admin`)
  - `avatar_url TEXT`
  - `state_id UUID REFERENCES public.locations_states(id) ON DELETE SET NULL`
  - `city TEXT`
  - `highest_education TEXT`
  - `current_employment_status TEXT`
  - `resume_url TEXT`
  - `email_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Security Rules & RLS:**
  - `SELECT`: User can view their own profile (`auth.uid() = id`). Administrators can view all profiles (`is_admin()`).
  - `UPDATE`: User can update their personal information (`auth.uid() = id`), but cannot alter their `role` column directly (enforced via database trigger or service role).
  - `INSERT/DELETE`: Managed via Supabase Auth triggers and Admin functions.

---

### Table 2: `public.opportunities`
- **Purpose:** Central repository for all Nigerian jobs, scholarships, NYSC PPAs, graduate trainees, fellowships, and grants.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`.
- **Columns:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `title TEXT NOT NULL`
  - `slug TEXT NOT NULL UNIQUE`
  - `organization_name TEXT NOT NULL`
  - `organization_logo_url TEXT`
  - `category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT`
  - `state_id UUID REFERENCES public.locations_states(id) ON DELETE SET NULL`
  - `city TEXT`
  - `workplace_policy workplace_policy NOT NULL DEFAULT 'on_site'`
  - `opportunity_type opportunity_type NOT NULL DEFAULT 'full_time'`
  - `experience_level TEXT`
  - `salary_or_stipend_range TEXT`
  - `description TEXT NOT NULL`
  - `requirements TEXT NOT NULL`
  - `benefits TEXT`
  - `application_deadline TIMESTAMPTZ`
  - `is_locked BOOLEAN NOT NULL DEFAULT TRUE` (Determines if application contacts require a subscription)
  - `employer_email TEXT` (Private, masked on server)
  - `employer_phone TEXT` (Private, masked on server)
  - `application_url TEXT` (Private, masked on server)
  - `application_instructions TEXT` (Private, masked on server)
  - `status opportunity_status NOT NULL DEFAULT 'draft'` (`draft`, `pending_review`, `published`, `archived`, `expired`)
  - `is_featured BOOLEAN NOT NULL DEFAULT FALSE`
  - `views_count INT NOT NULL DEFAULT 0`
  - `created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
  - `published_at TIMESTAMPTZ`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Indexes:** B-Tree on `status`, `category_id`, `state_id`, `opportunity_type`, `is_featured`, `slug`; GIN index on `to_tsvector('english', title || organization_name || description)`.
- **Security Rules & RLS:**
  - `SELECT`: Public / anyone can read rows where `status = 'published'`. However, `maskOpportunityForPublic()` in the server layer ensures sensitive contact fields (`employer_email`, `employer_phone`, `application_url`, `application_instructions`) are stripped unless the user holds an active, verified subscription.
  - `INSERT/UPDATE/DELETE`: Restricted strictly to administrators (`is_admin()`).

---

### Table 3: `public.user_subscriptions`
- **Purpose:** Tracks 30-day all-access membership passes. Strictly non-recurring in V1.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`.
- **Columns:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE`
  - `status subscription_status NOT NULL DEFAULT 'inactive'` (`inactive`, `pending_verification`, `active`, `expired`, `cancelled`)
  - `plan_name TEXT NOT NULL DEFAULT '30-Day All-Access Pass'`
  - `plan_price_kobo BIGINT NOT NULL DEFAULT 350000` (₦3,500.00)
  - `activated_at TIMESTAMPTZ`
  - `expires_at TIMESTAMPTZ`
  - `auto_renew BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Triggers:** `trg_subscription_expiry` automatically transitions `status` to `'expired'` if `expires_at < NOW()`.
- **Security Rules & RLS:**
  - `SELECT`: User can view their own subscription (`auth.uid() = user_id`).
  - `INSERT/UPDATE/DELETE`: Regular users have zero write permissions. Updates happen solely through the service role (Paystack webhook verification or Admin bank transfer approval).

---

### Table 4: `public.payment_transactions`
- **Purpose:** Comprehensive financial ledger for all Paystack payments and bank transfer receipt submissions.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`.
- **Columns:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `amount_kobo BIGINT NOT NULL DEFAULT 350000`
  - `currency TEXT NOT NULL DEFAULT 'NGN'`
  - `channel payment_channel NOT NULL` (`paystack`, `bank_transfer`, `manual_admin_grant`)
  - `status transaction_status NOT NULL DEFAULT 'pending_verification'` (`pending_verification`, `approved`, `rejected`, `refunded`)
  - `reference TEXT NOT NULL UNIQUE`
  - `receipt_storage_path TEXT`
  - `sender_bank_name TEXT`
  - `sender_account_name TEXT`
  - `transfer_date DATE`
  - `verified_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`
  - `verified_at TIMESTAMPTZ`
  - `rejection_reason TEXT`
  - `gateway_response JSONB`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Security Invariant:** Submitting a bank transfer receipt sets `status = 'pending_verification'`. It never activates membership. Only administrator approval via `activate_subscription()` or Paystack charge verification triggers membership activation.
- **Security Rules & RLS:**
  - `SELECT`: Users read their own transactions (`auth.uid() = user_id`).
  - `INSERT`: Users can submit bank transfer receipts under their own authenticated ID (`auth.uid() = user_id AND channel = 'bank_transfer' AND status = 'pending_verification'`).
  - `UPDATE/DELETE`: Administrators only (`is_admin()`).

---

### Table 5: `public.bank_account_config` (Owner-Configured Bank Account)
- **Purpose:** Stores the platform owner's receiving bank account details. Never assumed, hardcoded, or generated.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`.
- **Columns:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `bank_name TEXT` (e.g. Zenith Bank, GTBank, Access Bank)
  - `account_number TEXT` (10-digit NUBAN account number)
  - `account_name TEXT` (Corporate receiving entity name)
  - `transfer_instructions TEXT` (Custom payment guidance)
  - `is_enabled BOOLEAN NOT NULL DEFAULT FALSE` (Availability toggle)
  - `configured_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
  - `configured_at TIMESTAMPTZ`
  - `updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Constraints:** Enforced as a singleton table via unique index `idx_bank_config_singleton ON public.bank_account_config ((TRUE))`.
- **Security Rules & RLS:**
  - `SELECT`: Authenticated users can read when `is_enabled = TRUE`. Administrators can read in any state.
  - `INSERT/UPDATE/DELETE`: Restricted strictly to `super_admin` and `admin` roles. Every update produces an entry in `admin_audit_logs`.

---

### Table 6: `public.companies`
- **Purpose:** Employer and institutional profiles, verification status, and branding.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`.
- **Columns:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `name TEXT NOT NULL UNIQUE`
  - `slug TEXT NOT NULL UNIQUE`
  - `logo_url TEXT`
  - `website_url TEXT`
  - `industry TEXT`
  - `headquarters_city TEXT`
  - `headquarters_state_id UUID REFERENCES public.locations_states(id) ON DELETE SET NULL`
  - `official_email TEXT`
  - `official_phone TEXT`
  - `is_verified BOOLEAN NOT NULL DEFAULT FALSE`
  - `verified_at TIMESTAMPTZ`
  - `verified_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`
  - `total_listings_count INT NOT NULL DEFAULT 0`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Security Rules & RLS:** Public read; administrator write.

---

### Table 7: `public.job_applications`
- **Purpose:** Audit tracking of subscriber engagements with unlocked opportunities.
- **Columns:** `id`, `user_id`, `opportunity_id`, `application_method`, `applied_at`.
- **Security Rules & RLS:** User reads and writes own records (`auth.uid() = user_id`); Admin reads all.

---

### Table 8: `public.saved_opportunities`
- **Purpose:** User bookmarks for opportunities of interest.
- **Columns:** `id`, `user_id`, `opportunity_id`, `created_at`.
- **Security Rules & RLS:** User manages own bookmarks (`auth.uid() = user_id`).

---

### Table 9: `public.recently_viewed`
- **Purpose:** Stores the user's recently viewed opportunities.
- **Columns:** `id`, `user_id`, `opportunity_id`, `viewed_at`.
- **Security Rules & RLS:** User manages own history (`auth.uid() = user_id`).

---

### Table 10: `public.blog_posts`
- **Purpose:** Editorial career advice, anti-scam warnings, and NYSC guides.
- **Columns:** `id`, `slug`, `title`, `excerpt`, `content`, `category`, `cover_image_url`, `author_name`, `is_published`, `published_at`, `views_count`.
- **Security Rules & RLS:** Public read on published posts (`is_published = true`); Admin full management.

---

### Table 11: `public.notifications`
- **Purpose:** In-app payment receipts updates, subscription activation alerts, and global broadcasts.
- **Columns:** `id`, `user_id` (NULL for global), `title`, `message`, `type`, `action_url`, `is_read`, `created_at`.
- **Security Rules & RLS:** Users read own or broadcast notifications (`user_id IS NULL OR user_id = auth.uid()`).

---

### Table 12: `public.authorized_sources`
- **Purpose:** Registered feeds and API sources for the Job Import Centre.
- **Columns:** `id`, `name`, `source_type`, `endpoint_url`, `default_category_id`, `is_active`, `total_imported_records`.
- **Security Rules & RLS:** Admin only.

---

### Table 13: `public.admin_audit_logs`
- **Purpose:** Immutable audit trail for sensitive administrative operations (payment approvals, rejections, settings updates).
- **Columns:** `id`, `admin_id` (Nullable for system events), `action`, `target_table`, `target_id`, `previous_state`, `new_state`, `ip_address`, `created_at`.
- **Security Rules & RLS:** Admin read-only; append-only via server service role and database functions.

---

### Table 14: `public.locations_states`
- **Purpose:** Reference data for all 36 Nigerian States + FCT, categorized by geopolitical zone.
- **Columns:** `id`, `name`, `slug`, `geopolitical_zone`, `is_active`, `sort_order`.
- **Security Rules & RLS:** Public read.

---

### Table 15: `public.categories`
- **Purpose:** Opportunity categorizations (Banking, Tech, NYSC, Trainee, Remote, Scholarships, etc.).
- **Columns:** `id`, `name`, `slug`, `description`, `icon_name`, `is_featured`, `sort_order`.
- **Security Rules & RLS:** Public read.

---

### Table 16: `public.platform_settings`
- **Purpose:** Global configuration parameters (pricing amount, maintenance mode, Paystack toggles).
- **Columns:** `key` (PK), `value` (JSONB), `description`, `updated_by`, `updated_at`.
- **Security Rules & RLS:** Public read on public settings; Admin manage.
