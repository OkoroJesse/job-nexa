# JobNexa QA Report
**Version:** 2.0 (PostgreSQL Migrations, Rate Limiting & Payment Hardening)  
**Date:** 2026-11-09  
**Engineers:** QA, Application Security & DevOps Engineering  

---

## Executive Summary

| Category | PASS | FAIL | FIXED | MANUAL REQUIRED |
|---|---|---|---|---|
| Authentication & Session Guards | 3 | 0 | 1 | 2 |
| Free Browsing & Server-Side Masking | 3 | 0 | 0 | 1 |
| Payment – Paystack (Init, Verify, Webhook) | 5 | 0 | 2 | 1 |
| Payment – Bank Transfer (Owner Config, Receipts) | 6 | 0 | 3 | 1 |
| Payment API Rate Limiting (@upstash/ratelimit) | 5 | 0 | 1 | 0 |
| Admin Access Control & Audit Trails | 3 | 0 | 1 | 1 |
| Job & Opportunity Catalog & CRUD | 3 | 0 | 0 | 2 |
| Import Centre & Duplicate Detection | 3 | 0 | 0 | 1 |
| SEO, Robots, Sitemap & Structured Data | 4 | 0 | 4 | 1 |
| Build & TypeScript Compilation | 1 | 0 | 0 | 0 |
| Mobile Responsiveness | 1 | 0 | 0 | 1 |
| **Total Automated Tests (Node Test Runner)** | **12** | **0** | **0** | **0** |

---

## Automated Test Suite Execution Results

**Command:** `node --test tests/rate-limit-and-payments.test.mjs`  
**Execution Timestamp:** 2026-11-09 16:09:54 WAT  
**Status:** ✅ **12 / 12 PASSING (0 Failures, 0 Cancelled, 0 Skipped)**

```
TAP version 13
# Subtest: JobNexa Rate Limiting & Payment Security Suite
    # Subtest: 1. Rate Limiter Key Generation & Configuration
        ok 1 - should prioritize authenticated user ID over IP address
        ok 2 - should have sensible, distinct rate limit thresholds per route
    ok 1 - 1. Rate Limiter Key Generation & Configuration
    # Subtest: 2. Rate Limit Exceeded Responses & Retry Headers (HTTP 429)
        ok 1 - should allow normal requests under the configured threshold
        ok 2 - should reject requests exceeding limits with HTTP 429 and retry info
        ok 3 - should track rate limits per user/IP independently (no cross-user blocking)
    ok 2 - 2. Rate Limit Exceeded Responses & Retry Headers (HTTP 429)
    # Subtest: 3. Paystack Webhook Timing-Safe HMAC Verification & Retries
        ok 1 - should successfully verify a genuine Paystack webhook HMAC signature
        ok 2 - should reject tampered payload or forged signature
        ok 3 - should idempotently handle duplicate webhook retries without double activations
    ok 3 - 3. Paystack Webhook Timing-Safe HMAC Verification & Retries
    # Subtest: 4. Owner-Configured Bank Account Security (Never Hardcoded)
        ok 1 - should NOT allow bank transfer payment if unconfigured or disabled
        ok 2 - should validate Nigerian bank account number format (10 digits) on update
        ok 3 - should never expose sensitive database credentials or secret keys in public bank config
    ok 4 - 4. Owner-Configured Bank Account Security (Never Hardcoded)
    # Subtest: 5. Bank Transfer Invariant: Receipt Upload Never Auto-Activates Membership
        ok 1 - should insert payment transaction with pending_verification and leave subscriptions untouched
    ok 5 - 5. Bank Transfer Invariant: Receipt Upload Never Auto-Activates Membership
ok 1 - JobNexa Rate Limiting & Payment Security Suite
# tests 12 | pass 12 | fail 0
```

---

## Detailed Test Results by Domain

### 1. RATE LIMITING (Production Upstash Redis Sliding Window)

#### RL-01 — Sensible Per-Route Thresholds
| Field | Detail |
|---|---|
| **Status** | ✅ PASS (Automated) |
| **Route / Limiter** | `paystack_init` (5 req / 60s), `paystack_verify` (10 req / 60s), `bank_transfer` (3 req / 300s), `webhook_paystack` (60 req / 60s) |
| **Expected** | Different thresholds matching endpoint criticality and normal user flows |
| **Actual** | Implemented in `lib/rate-limit.ts` using `@upstash/ratelimit` sliding window algorithm. Bank transfer allows max 3 submissions per 5 min to prevent spamming receipt storage; webhook permits up to 60 events/minute so legitimate Paystack network retries are never blocked. |

#### RL-02 — Key Generation Priority
| Field | Detail |
|---|---|
| **Status** | ✅ PASS (Automated) |
| **Logic** | `getRateLimitKey()` extracts user ID from authenticated session (`uid:${userId}`). Falls back to `x-real-ip` or `x-forwarded-for` (`ip:${ip}`). |
| **Expected** | User ID takes priority over IP address; no shared IP blocking for distinct authenticated users. |
| **Actual** | Verified in automated test suite. Authenticated users are limited individually; NAT proxies / campus Wi-Fi networks do not cause false positives across separate accounts. |

#### RL-03 — HTTP 429 & Retry Information
| Field | Detail |
|---|---|
| **Status** | ✅ PASS (Automated) |
| **Test** | Send requests exceeding threshold. Inspect HTTP response code and headers. |
| **Expected** | HTTP 429 Too Many Requests; headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset`. JSON body: `{ error, retryAfterSeconds }`. |
| **Actual** | Verified. `rateLimitExceededResponse()` generates standard RFC 6585 rate limit headers and user-friendly countdown timer. |

#### RL-04 — Fail-Open Resilience
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Test** | Simulate Redis outage or missing credentials during local development. |
| **Expected** | Does not crash application; fails open so legitimate payments are never abruptly halted by cache downtime. |
| **Actual** | `checkRateLimit()` catches Redis connection errors and returns `{ allowed: true }` with warning logged to server console. |

---

### 2. OWNER-CONFIGURED BANK ACCOUNT & TRANSFERS

#### BANK-CFG-01 — Never Hardcoded Bank Details
| Field | Detail |
|---|---|
| **Status** | ✅ FIXED & VERIFIED |
| **Test** | Inspect codebase, seeds, and API responses for hardcoded receiving bank numbers. |
| **Expected** | Zero hardcoded corporate accounts in source code. Account details stored solely in `public.bank_account_config`. |
| **Actual** | Migrations `000002` and `000004` removed hardcoded account details from `platform_settings` and `seed.sql`. Initial state has `is_enabled = FALSE` with null account credentials. |

#### BANK-CFG-02 — Hiding Bank Transfer When Disabled
| Field | Detail |
|---|---|
| **Status** | ✅ PASS (Automated + Frontend Verified) |
| **Test** | Load `/pricing` when `is_enabled = FALSE` or unconfigured. |
| **Expected** | Bank Transfer payment rail is completely hidden. User is only offered Paystack card/USSD payment. |
| **Actual** | `app/pricing/page.tsx` queries `/api/payment/bank-config`. If `is_enabled` is false, only Paystack is presented in the UI. |

#### BANK-CFG-03 — Admin Configuration & Audit Log
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Test** | Administrator updates bank account details via Admin Dashboard → Settings → Payment Settings → Bank Transfer. |
| **Expected** | Updates `bank_account_config`, validates 10-digit NUBAN, writes record into `admin_audit_logs`. |
| **Actual** | Handled in `app/api/admin/settings/bank-account/route.ts` with super_admin/admin role validation and audit logging. |

#### BANK-TX-01 — Receipt Upload Never Auto-Activates
| Field | Detail |
|---|---|
| **Status** | ✅ PASS (Automated + Route Verified) |
| **Test** | Submit bank transfer receipt via `/api/payments/bank-transfer/submit`. |
| **Expected** | `payment_transactions` record inserted with `status = 'pending_verification'`. `user_subscriptions` table is NOT modified. User remains unpaid. |
| **Actual** | Route and database triggers strictly enforce this invariant. Only admin approval via `/api/admin/verifications/approve` activates membership. |

---

### 3. PAYSTACK INTEGRATION & WEBHOOKS

#### PAY-01 — Timing-Safe HMAC-SHA512 Verification
| Field | Detail |
|---|---|
| **Status** | ✅ PASS (Automated) |
| **Test** | Post webhook with valid signature, tampered payload, forged signature. |
| **Expected** | Valid signature passes; tampered payload returns 401; constant-time byte comparison prevents timing oracle. |
| **Actual** | Implemented using `crypto.timingSafeEqual(sigBuffer, hashBuffer)`. |

#### PAY-02 — Duplicate Webhook Idempotency
| Field | Detail |
|---|---|
| **Status** | ✅ PASS (Automated) |
| **Test** | Submit identical Paystack webhook event 3 times. |
| **Expected** | 1st delivery activates 30-day membership; 2nd and 3rd deliveries return HTTP 200 with `{ status: 'already_processed' }` without double-activating or duplicating records. |
| **Actual** | Verified in automated test suite and webhook route handler. |

#### PAY-03 — Strict ₦3,500 Price Assertion
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Test** | Submit Paystack charge event with amount !== 350000 kobo (₦3,500). |
| **Expected** | Rejected; subscription is NOT activated if amount does not match exactly. |
| **Actual** | Both `/api/payments/paystack/verify` and `/api/webhooks/paystack` assert `amount === 350000`. |

---

### 4. DATA SECURITY & ROUTE GUARDS

#### SEC-01 — Server-Side Contact Masking
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Test** | Unauthenticated user loads `/jobs/[slug]`. Check RSC payload and HTML. |
| **Expected** | `employer_email`, `employer_phone`, `application_url`, `application_instructions` stripped on server. |
| **Actual** | `maskOpportunityForPublic()` in `lib/opportunities.ts` strips fields before returning to server component. |

#### SEC-02 — Middleware Route Protection
| Field | Detail |
|---|---|
| **Status** | ✅ PASS |
| **Test** | Direct navigation to `/admin/*` or `/dashboard/*` without authenticated session. |
| **Expected** | Redirect to `/login?redirect=...`. Non-admins on `/admin/*` redirected to `/dashboard`. |
| **Actual** | Implemented in `middleware.ts`. |

---

## Pre-Deployment Checklist Status

| ID | Severity | Description | Current Status |
|---|---|---|---|
| OPEN-01 | High | Demo mode admin fallback in `lib/admin-auth.ts` | **Mitigated:** Only active when Supabase URL has "placeholder". Blocked by `middleware.ts` in production. |
| OPEN-02 | High | Storage bucket MIME type & size restrictions | **FIXED:** Created `supabase/migrations/20261109000003_storage_buckets_and_policies.sql` enforcing 5MB max and whitelisted image/PDF types. |
| OPEN-03 | Medium | Rate limiting on payment API routes | **FIXED:** Implemented `@upstash/ratelimit` with Redis sliding window on all payment routes. 12 automated tests passing. |
| OPEN-04 | Medium | Paystack live webhook end-to-end | **Ready for live test:** Set live webhook URL in Paystack Dashboard once domain is live. |
| OPEN-05 | Low | Owner bank account configuration | **FIXED:** Owner configures via Admin Settings. Hidden from users until configured and enabled. |
