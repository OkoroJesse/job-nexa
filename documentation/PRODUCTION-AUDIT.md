# JobNexa Production-Readiness Audit Report

**Date:** 09 November 2026  
**Auditor:** Senior Production Engineering & Security Team  
**Scope:** Full-Stack Architecture, Database, Authentication, Payments, Security, and Admin Systems  
**Status:** In Progress (Remediation Underway)

---

## 1. Executive Summary

JobNexa is transitioning from a functional prototype to a genuine, real-world Nigerian opportunities platform. The target infrastructure (Supabase PostgreSQL and Upstash Redis) has been provisioned and verified. This audit identifies every instance of simulated, mocked, hardcoded, test-only, or non-functional behavior across the codebase and outlines the concrete remediation steps required for production readiness.

---

## 2. In-Depth Findings by System Area

### A. Authentication & Session Management
| Severity | Component | Finding | Production Requirement |
|---|---|---|---|
| **CRITICAL** | `app/login/page.tsx` | Displays "Instant Test Login (No Password Required)" with 1-click buttons for "Free Seeker" and "30-Day Pro". | **REMOVE COMPLETELY.** Only genuine Supabase email + password authentication permitted. |
| **CRITICAL** | `components/providers/AuthProvider.tsx` | Uses `loginDemoUser()`, `simulatePaystackSuccess()`, and syncs fake user/subscription state to `localStorage`. | Replace with genuine `supabase.auth.onAuthStateChange` listener and live database queries to `profiles` and `user_subscriptions`. |
| **HIGH** | `app/register/page.tsx` | Fallback catch block calls `loginDemoUser('free')` if Supabase signup errors. | Display genuine error feedback to user (e.g. "User already registered", "Weak password") and enforce email verification. |
| **HIGH** | `components/layout/Navbar.tsx` | Header contains "Dev Testing" perspective buttons ("Free" and "Pro ₦3,500") that invoke demo logins. | **REMOVE COMPLETELY** from all public and authenticated views. |
| **HIGH** | Navigation & Routing | Missing `/forgot-password` and `/reset-password` user flows. | Implement full self-service password reset flows using Supabase Auth recovery emails. |
| **CRITICAL** | `app/jobs/[slug]/page.tsx` | Line 33 checks `cookies().get('jobnexa_is_active')?.value === 'true'`. | **SECURITY VULNERABILITY:** An unpaid visitor could spoof this cookie in developer tools to unlock contact details without payment. Rely solely on server-verified session from database. |

---

### B. Database Integration & Data Persistence
| Severity | Component | Finding | Production Requirement |
|---|---|---|---|
| **HIGH** | `lib/opportunities.ts` | Falls back to `SEED_OPPORTUNITIES` array when database returns 0 rows. | Return authentic empty array `[]` so UI renders genuine empty states when no listings match or catalog is empty. |
| **HIGH** | `app/admin/opportunities/new` & `[id]/edit` | Categories and states dropdowns are populated with static mock IDs (`cat-1`, `state-1`) instead of real Supabase UUIDs. | Fetch live taxonomies from `categories` and `locations_states` to prevent Postgres UUID syntax errors and foreign key violations. |
| **HIGH** | `app/admin/opportunities/page.tsx` | Opportunity list is managed in `useState(SEED_OPPORTUNITIES)` with no backend persistence on toggle. | Connect to `/api/admin/opportunities` to perform genuine CRUD operations against the Supabase database. |
| **HIGH** | `app/dashboard/saved/page.tsx` | Saved jobs are stored in `localStorage` and filtered against `SEED_OPPORTUNITIES`. | Persist bookmarks to `public.saved_opportunities` in Supabase with RLS enforcement. |
| **HIGH** | `app/api/admin/users/route.ts` | Falls back to `mockUsers` when database query yields 0 rows. | Return actual registered candidate profiles from `public.profiles`. |
| **HIGH** | `app/admin/taxonomies/page.tsx` | Displays static arrays instead of live categories and 36 states + FCT from Supabase. | Query `categories` and `locations_states` dynamically. |

---

### C. Admin Dashboard & Operations Console
| Severity | Component | Finding | Production Requirement |
|---|---|---|---|
| **HIGH** | `app/admin/page.tsx` | Displays hardcoded statistics (e.g. "3 Receipts", "184 Subscribers", "₦644,000 MRR", "8 Listings", "5 Drafts"). | Query real aggregation counts (`count()`, `sum()`) from `payment_transactions`, `user_subscriptions`, and `opportunities`. |
| **CRITICAL** | `app/admin/verifications/page.tsx` | Contains hardcoded `INITIAL_QUEUE` with 3 fake receipts. | Implement `GET /api/admin/verifications` querying `payment_transactions` where `channel = 'bank_transfer' AND status = 'pending_verification'`. |
| **HIGH** | `app/admin/paystack/page.tsx` | Contains hardcoded `INITIAL_RECORDS` with fake transaction cards. | Query `payment_transactions` where `channel = 'paystack'`. |
| **MEDIUM** | `app/admin/employers/page.tsx` | Hardcoded `INITIAL_COMPANIES` in local state. | Connect to `employers_companies` table in Supabase. |
| **MEDIUM** | `app/admin/activity-logs/page.tsx` | Hardcoded `INITIAL_LOGS` in local state. | Query live `admin_audit_logs` table. |
| **MEDIUM** | `app/admin/analytics/page.tsx` | Hardcoded revenue metrics and conversion charts. | Compute real revenue from settled transactions. |
| **MEDIUM** | `app/admin/notifications/page.tsx` | In-memory broadcast state. | Persist to `notifications_announcements` table. |
| **MEDIUM** | `app/admin/blog/page.tsx` | In-memory blog posts state. | Persist to `blog_posts` table. |
| **MEDIUM** | `app/admin/import-centre/page.tsx` | Staging queue hardcoded to `INITIAL_STAGED`. | Query `opportunities` where `status = 'draft'`. |

---

### D. Payment Systems & Rate Limiting
| Severity | Component | Finding | Production Requirement |
|---|---|---|---|
| **HIGH** | `components/jobs/LockedPaywallCard.tsx` | Contains "Simulate Instant Unlock" button calling `simulatePaystackSuccess()`. | **REMOVE COMPLETELY.** Only real checkout via Paystack or verified bank transfer is permitted. |
| **HIGH** | Rate Limiting Scope | Rate limits previously only covered payment routes. | Extend `@upstash/ratelimit` protection to `/api/auth/login`, `/api/auth/register`, and `/api/auth/forgot-password` to prevent credential brute-forcing and account creation spam. |
| **MEDIUM** | Receipt Uploads | Local mock path `/receipts/filename.pdf` used when storage bucket was unconfigured. | Upload directly to Supabase private storage bucket `payment-receipts` under `{userId}/{uuid}.{ext}`. |

---

## 3. Remediation Roadmap

1. **Phase 2 (Real Authentication):**
   - Clean up `app/login/page.tsx`, `app/register/page.tsx`, `Navbar.tsx`, and `LockedPaywallCard.tsx`.
   - Re-architect `AuthProvider.tsx` to rely 100% on Supabase Auth session and live database state.
   - Implement `/forgot-password` and `/reset-password` pages.
2. **Phase 3 (Real Database Integration):**
   - Remove mock fallbacks from `lib/opportunities.ts`.
   - Update `app/dashboard/saved/page.tsx` to read/write to `public.saved_opportunities`.
   - Update `lib/admin-auth.ts` to strictly require live authentication.
3. **Phase 4 & 5 (Payments & Redis Rate Limiting):**
   - Wire live receipt uploads to Supabase Storage.
   - Implement rate-limited server endpoints for authentication and password resets.
4. **Phase 6 (Admin Dashboard Live Integration):**
   - Replace all hardcoded queues, statistics, and tables in `/admin/*` with dynamic Supabase queries and API routes.
5. **Phase 7 & 8 (Public Website & Security Audit):**
   - Fix insecure client cookie check in job detail page.
   - Provide professional empty states across all catalog and dashboard views.
6. **Phase 9 & 10 (Verification & Testing):**
   - Run complete test suite, TypeScript check, and Next.js production build.
