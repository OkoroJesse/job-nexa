# JobNexa Post-Launch Operations & Remaining Tasks

**Generated:** 09 November 2026  
**Owner:** JobNexa Platform Administrator

This document details the checklist of external operations required before public traffic is directed to the JobNexa platform.

---

## 1. External Credentials & Third-Party APIs

### 1.1 Paystack Live Merchant Activation
- [ ] Upgrade Paystack account from **Test Mode** to **Live Mode** in the Paystack Dashboard (`dashboard.paystack.com`).
- [ ] Retrieve live API credentials:
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: `pk_live_...`
  - `PAYSTACK_SECRET_KEY`: `sk_live_...`
- [ ] Update production environment variables on Vercel / Railway / hosting provider.
- [ ] Configure Paystack Webhook URL:
  - Target: `https://yourdomain.com/api/webhooks/paystack`
  - Events: Ensure `charge.success` is selected.

### 1.2 Supabase Custom SMTP Configuration
- [ ] By default, Supabase's built-in email provider has a rate limit of 3–4 emails per hour.
- [ ] Set up a dedicated transactional email provider (e.g., SendGrid, Resend, Amazon SES, or Mailgun).
- [ ] In Supabase Console → **Authentication** → **SMTP Settings**:
  - Enable custom SMTP.
  - Fill in host, port, username, sender email (e.g. `notifications@jobnexa.ng`), and password.
- [ ] Customize email templates:
  - Confirm signup email (`app/register`).
  - Magic link / recovery email (`app/reset-password`).

### 1.3 Supabase Database Migration Checklist
- [ ] Open Supabase Dashboard → **SQL Editor**.
- [ ] Confirm execution of triggers from `supabase/migrations/20261109000002_complete_schema.sql`:
  - `trg_prevent_role_escalation` (prevents malicious role changes)
  - `handle_new_user` (automatically provisions `profiles` row on auth signup)
- [ ] Confirm execution of storage policies from `supabase/migrations/20261109000003_storage_buckets_and_policies.sql`:
  - Bucket `payment-receipts` created (private)
  - RLS policies allowing authenticated users to upload and admins to read receipts

---

## 2. Administrator Initial Setup

### 2.1 First Super Admin Account Provisioning
To create your initial Super Admin account without exposing credentials:
1. Register normally through the website registration page: `https://yourdomain.com/register`.
2. Confirm the email address.
3. Open Supabase Dashboard → **Table Editor** → **profiles**.
4. Locate your row (by your email address).
5. Change the `role` column from `'job_seeker'` to `'super_admin'`.
6. Save the row.
7. Log into `https://yourdomain.com/admin` to access the full administrative console.

### 2.2 Configure Platform Bank Account
1. Log into the Admin Dashboard → **Platform Settings** (`/admin/settings`).
2. Provide your receiving Nigerian bank details:
   - Bank Name (e.g. Zenith Bank, GTBank, Access Bank, Moniepoint)
   - 10-Digit NUBAN Account Number
   - Account Name (matching bank records)
   - Specific transfer instructions or notes for candidates
3. Toggle **Enable Bank Transfer Rail** to active.
4. Save configuration. Candidates will now be able to pay via bank transfer.

---

## 3. SEO & Domain Verification

- [ ] Add production domain in hosting provider (e.g. Vercel Domains).
- [ ] Update `NEXT_PUBLIC_APP_URL` to `https://yourdomain.com`.
- [ ] Verify domain ownership in Google Search Console.
- [ ] Submit XML sitemap at `https://yourdomain.com/sitemap.xml`.
