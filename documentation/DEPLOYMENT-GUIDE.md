# JobNexa Deployment Guide
**Version:** 1.0  
**Date:** 2026-11-09  
**Stack:** Next.js 14 · Supabase (PostgreSQL + Auth + Storage) · Paystack · Vercel  

> [!IMPORTANT]
> Do NOT take any of the following actions without reviewing each step. This guide is for reference only. No live credentials should be created, modified, or committed without explicit approval.

---

## Prerequisites

- Node.js v18+ (project uses v22.21.1)
- npm v10+
- A [Supabase](https://supabase.com) account
- A [Paystack](https://paystack.com) account (Nigerian business registration required for live mode)
- A [Vercel](https://vercel.com) account
- A registered domain (e.g. `jobnexa.ng`)

---

## Step 1 — Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **New project**
3. Choose your organisation
4. Set project name: `jobnexa-production`
5. Set a strong database password (save it securely — you cannot retrieve it later)
6. Select region: **West EU (Ireland)** or the closest to your users
7. Click **Create new project** (takes ~2 minutes)

### 1.2 Obtain Supabase API Keys

Navigate to **Project Settings → API**:

| Variable | Where to Find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" (e.g. `https://abcdefgh.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "Project API Keys → anon / public" |
| `SUPABASE_SERVICE_ROLE_KEY` | "Project API Keys → service_role" — keep this secret |

> [!CAUTION]
> Never commit `SUPABASE_SERVICE_ROLE_KEY` to git. Never prefix it with `NEXT_PUBLIC_`. It bypasses all Row Level Security.

### 1.3 Run Database Migrations

Using the Supabase SQL Editor (Dashboard → SQL Editor → New Query):

**Run in this exact sequential order:**

1. **Migration 1:** `supabase/migrations/20261109000000_initial_schema.sql`
   - Enums, Core Taxonomies, Profiles, Opportunities, Subscriptions, Transactions, Bookmarks, Initial RLS.
2. **Migration 2:** `supabase/migrations/20261109000001_admin_and_business_system.sql`
   - Companies, Editorial CMS, Notifications, Authorized Import Sources, Rejection procedures.
3. **Migration 3:** `supabase/migrations/20261109000002_complete_schema.sql`
   - Owner-configured Bank Account (`bank_account_config`), Job Applications, Recently Viewed, GIN FTS indexes, Subscription auto-expiry triggers.
4. **Migration 4:** `supabase/migrations/20261109000003_storage_buckets_and_policies.sql`
   - Creates `payment-receipts` (private, 5MB), `organization-logos` (public, 2MB), and `resumes` (private, 10MB) buckets with RLS policies.
5. **Migration 5:** `supabase/migrations/20261109000004_initial_reference_seed_data.sql`
   - All 36 Nigerian States + FCT, 10 categories, platform settings, initial authorized sources.

---

## Step 2 — Upstash Redis Rate Limiting Setup

Production rate limiting is powered by `@upstash/ratelimit` with Upstash Redis to protect sensitive payment routes against brute-force attacks and abuse.

### 2.1 Create an Upstash Redis Database
1. Go to [console.upstash.com](https://console.upstash.com).
2. Click **"Create Database"**.
3. Choose database name: `jobnexa-ratelimit-prod`.
4. Select region: **eu-west-1 (Ireland)** or **eu-central-1 (Frankfurt)**.
5. Select **TLS Enabled** (checked by default).
6. Click **Create**.

### 2.2 Obtain Upstash REST API Credentials
1. Under the **"REST API"** section in your Upstash database details:
   - Copy the `UPSTASH_REDIS_REST_URL` (starts with `https://...upstash.io`).
   - Copy the `UPSTASH_REDIS_REST_TOKEN` (starts with `A...`).
2. Add these variables to your Vercel Environment Variables console (Server only — never prefix with `NEXT_PUBLIC_`).

### 1.4 Create Storage Buckets

Go to **Storage → New bucket** and create:

| Bucket Name | Public | Allowed MIME Types |
|---|---|---|
| `payment-receipts` | ❌ Private | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| `organization-logos` | ✅ Public | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` |

**Storage RLS Policies for `payment-receipts` bucket:**

In Supabase Dashboard → Storage → `payment-receipts` → Policies → New Policy:

```sql
-- Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own receipts  
CREATE POLICY "Users can read own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow service role (admin) to read all receipts
CREATE POLICY "Service role can read all receipts"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'payment-receipts');
```

### 1.5 Configure Supabase Auth

Go to **Authentication → Settings**:

1. Set **Site URL** to `https://jobnexa.ng`
2. Add Redirect URLs: `https://jobnexa.ng/**` and `https://www.jobnexa.ng/**`
3. Set **Email confirm** to **Required** (for production)
4. Disable **Enable email OTP** if not needed

### 1.6 Create the First Admin User

After deployment, create a super admin account:

1. Register via `/register` using your admin email
2. In Supabase SQL Editor, run:
```sql
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-admin-email@example.com';
```

---

## Step 2 — Paystack Setup

### 2.1 Obtain Paystack Keys

1. Log in to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Go to **Settings → API Keys & Webhooks**

| Variable | Where to Find |
|---|---|
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Starts with `pk_live_` (live) or `pk_test_` (test) |
| `PAYSTACK_SECRET_KEY` | Starts with `sk_live_` (live) or `sk_test_` (test) |

> [!WARNING]
> Use `pk_test_` and `sk_test_` during testing. Only switch to live keys after verifying the payment flow end-to-end in test mode.

### 2.2 Configure Paystack Webhook

1. In Paystack Dashboard → **Settings → API Keys & Webhooks → Webhook URL**
2. Set webhook URL to: `https://jobnexa.ng/api/webhooks/paystack`
3. Click **Save**
4. Use **Send Test Event** to verify the webhook receives `charge.success` events

> [!IMPORTANT]
> The webhook handler at `/api/webhooks/paystack` validates:
> - HMAC-SHA512 signature (using `x-paystack-signature` header)
> - Amount exactly equals 350000 kobo (₦3,500)
> - Idempotency: duplicate events are safely rejected

### 2.3 Configure Payment Amount

The ₦3,500 / 30-day subscription amount is hardcoded in multiple places. If you need to change the price, update:
- `app/pricing/page.tsx` — display amount
- `app/api/payments/paystack/initialize/route.ts` — `amount: 350000`
- `app/api/payments/paystack/verify/route.ts` — assertion `resData.data.amount === 350000`
- `app/api/webhooks/paystack/route.ts` — assertion `amount === 350000`

---

## Step 3 — Vercel Deployment

### 3.1 Connect Repository

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)
5. Root directory: `/` (project root)

### 3.2 Configure Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

| Variable | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key) | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role key) | Production only |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_...` | Production |
| `PAYSTACK_SECRET_KEY` | `sk_live_...` | Production only |
| `NEXT_PUBLIC_SITE_URL` | `https://jobnexa.ng` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://jobnexa.ng` | Production |

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` must be set as "Production only" and **without** `NEXT_PUBLIC_` prefix. Vercel will not expose them to the browser.

### 3.3 Deploy

Click **Deploy**. Vercel will run `npm install` → `npm run build` → deploy.

The build must complete with **exit code 0**. Check the deployment log in Vercel Dashboard.

### 3.4 Vercel Configuration

The `vercel.json` file at project root sets:
- Region: `lhr1` (London — closest to Nigeria)
- Framework: `nextjs`
- API CORS headers

---

## Step 4 — Custom Domain Setup

### 4.1 Add Domain in Vercel

1. Go to **Project → Settings → Domains**
2. Add `jobnexa.ng` and `www.jobnexa.ng`
3. Vercel will show you the required DNS records

### 4.2 Configure DNS at Your Registrar

Add these DNS records at your domain registrar (e.g. GoDaddy, Namecheap, NiRA):

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` (Vercel IP) |
| `CNAME` | `www` | `cname.vercel-dns.com` |

DNS propagation can take up to 48 hours. HTTPS is provisioned automatically by Vercel via Let's Encrypt.

### 4.3 Verify HTTPS

After DNS propagation, visit `https://jobnexa.ng` — the padlock should appear. Vercel auto-renews SSL certificates.

---

## Step 5 — Post-Deployment Verification

### 5.1 Checklist

- [ ] Homepage loads at `https://jobnexa.ng`
- [ ] Job listings load (Supabase connected)
- [ ] User can register and log in
- [ ] `/robots.txt` returns correct content
- [ ] `/sitemap.xml` returns valid XML with job URLs
- [ ] Paystack test payment completes and subscription activates
- [ ] Bank transfer receipt submission creates `pending_verification` record (not activated)
- [ ] Admin can log in and access `/admin`
- [ ] Admin can approve a pending bank transfer → subscription activates
- [ ] Response headers include `X-Frame-Options: DENY` (use browser DevTools)

### 5.2 Paystack Live Mode Activation

1. Complete Paystack business verification (requires CAC documents)
2. Once approved, switch to live keys in Vercel environment variables
3. Update Paystack webhook URL to point to `https://jobnexa.ng/api/webhooks/paystack`
4. Run one real ₦3,500 test transaction before opening to the public

---

## Step 6 — Monitoring & Maintenance

### 6.1 Vercel Analytics

Enable in **Vercel Dashboard → Project → Analytics**. Tracks page views, Core Web Vitals, and performance.

### 6.2 Supabase Monitoring

- **Dashboard → Logs** — Review auth logs and database errors
- **Dashboard → Reports** — Monthly usage statistics
- Enable Supabase email alerts for high error rates

### 6.3 Database Backups

- Supabase **Free plan**: No automatic backups — manual snapshots only
- Supabase **Pro plan**: Automatic daily backups (recommended for production)

**Manual backup (run from your machine with `psql` installed):**
```bash
pg_dump "postgres://postgres.[project-ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" > jobnexa_backup_$(date +%Y%m%d).sql
```

### 6.4 Monitoring Alerts

Set up at minimum:
- Vercel: Deploy failure notifications (Email/Slack)
- Supabase: Email alerts for high latency or errors (Pro plan)
- Paystack: Webhook failure notifications (Paystack Dashboard → Settings → Webhook Notifications)

---

## Step 7 — Rollback Procedures

### 7.1 Vercel Rollback

1. Go to **Vercel Dashboard → Project → Deployments**
2. Find the last known-good deployment
3. Click the three-dot menu → **Promote to Production**

Rollback is instant (no downtime).

### 7.2 Database Rollback

> [!CAUTION]
> Database rollbacks are destructive. Never roll back a database without a full backup.

If a migration introduced a breaking schema change:
1. Restore from the most recent Supabase backup
2. Or write a down-migration SQL script to reverse the specific migration
3. Contact Supabase support for point-in-time recovery (Pro plan only)

### 7.3 Environment Variable Rollback

If a credential needs to be rotated:
1. Generate new keys in Supabase/Paystack dashboards
2. Update in Vercel → **Project Settings → Environment Variables**
3. Trigger a new deployment (environment variable changes require redeployment)

---

## Required Environment Variables Summary

| Variable | Required | Contains Secret | Used In |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | No | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Partial | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Yes** | Server only |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | ✅ | No | Client (Paystack.js) |
| `PAYSTACK_SECRET_KEY` | ✅ | **Yes** | Server only |
| `UPSTASH_REDIS_REST_URL` | ✅ | No | Server only (Rate Limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | **Yes** | Server only (Rate Limiting) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | No | Sitemap, robots.txt |
| `NEXT_PUBLIC_APP_URL` | ✅ | No | App-wide URL building |
