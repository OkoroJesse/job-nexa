# Software Architecture Document: JobNexa

**System:** JobNexa Platform  
**Target:** Engineering, DevOps & Security Teams  
**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage), Paystack, Vercel  
**Architecture Style:** Modular Monolith with Serverless Edge & Managed Backend-as-a-Service (BaaS)  

---

## 1. High-Level Architecture Overview

JobNexa is built using a modern **Jamstack / BaaS** architecture combining **Next.js App Router** running on **Vercel's Global Edge Network** with a **Supabase PostgreSQL** database engine, managed Auth, and private object storage.

```
                              ┌─────────────────────────────────────────┐
                              │            END USERS / CLIENTS          │
                              │     Mobile Browsers, Desktop, PWA       │
                              └────────────────────┬────────────────────┘
                                                   │ HTTPS
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │          VERCEL EDGE NETWORK / CDN      │
                              │    Edge Caching, DDoS Protection, SSL   │
                              └────────────────────┬────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         │                                                   │
                         ▼                                                   ▼
         ┌───────────────────────────────┐                   ┌───────────────────────────────┐
         │ NEXT.JS APP ROUTER (FRONTEND) │                   │  NEXT.JS API & SERVER ACTIONS │
         │ - React Server Components     │                   │ - Paystack Webhook Handler    │
         │ - Client Islands (UI states)  │                   │ - Content Import Pipeline     │
         │ - Route Handlers (REST)       │                   │ - Admin Verification Actions  │
         │ - Server-Side Masking Engine  │                   │ - Presigned URL Generators    │
         └───────────────┬───────────────┘                   └───────────────┬───────────────┘
                         │                                                   │
                         └─────────────────────────┬─────────────────────────┘
                                                   │
                    ┌──────────────────────────────┴──────────────────────────────┐
                    │                                                             │
                    ▼                                                             ▼
    ┌───────────────────────────────┐                             ┌───────────────────────────────┐
    │     SUPABASE MANAGED CLOUD    │                             │       PAYSTACK GATEWAY        │
    │  - PostgreSQL 15+ (Data)      │                             │  - Charge Engine              │
    │  - Row-Level Security (RLS)   │                             │  - Webhook Dispatcher         │
    │  - GoTrue Auth (JWT/Sessions) │                             │  - Fraud / Card Risk Engine   │
    │  - Private Storage (S3-API)   │                             └───────────────────────────────┘
    └───────────────────────────────┘
```

---

## 2. Technology Stack & Decision Rationale

| Layer | Technology | Decision Justification |
|---|---|---|
| **Web Framework** | **Next.js 14/15 (App Router)** | Hybrid rendering (Server Components + Client Components). Critical for SEO indexing of job descriptions while ensuring dynamic server-side masking of locked contact details. |
| **Language** | **TypeScript (Strict Mode)** | Full end-to-end type safety across database schemas, API responses, and client forms. Reduces runtime bugs. |
| **Styling** | **Tailwind CSS** | Zero runtime CSS overhead, minimal bundle size (< 45KB), ultra-fast rendering on bandwidth-constrained Nigerian mobile networks (MTN, Airtel, Glo). |
| **Database & Auth** | **Supabase (PostgreSQL + GoTrue)** | Industrial-grade relational database with native JSONB support, strict Row-Level Security (RLS), ACID transactions, and built-in JWT authentication. |
| **Object Storage** | **Supabase Storage (S3-compatible)** | Segregated public buckets (company logos) and encrypted private buckets (user CVs, payment transfer receipts) with time-limited signed URLs. |
| **Payment Gateway** | **Paystack** | The gold standard for Nigerian payments. Native support for Nigerian debit cards, bank transfers, USSD, and Apple Pay, with reliable HMAC-signed webhooks. |
| **Hosting & CI/CD** | **Vercel** | Seamless Next.js deployment, automatic preview environments, edge middleware, global Anycast CDN, and automated SSL. |

---

## 3. Directory & Route Tree Structure

The project is structured according to the standard Next.js App Router conventions:

```
job-nexa/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── callback/route.ts
│   ├── (public)/
│   │   ├── page.tsx                           # Homepage (hero, search, featured, categories)
│   │   ├── jobs/
│   │   │   ├── page.tsx                       # Opportunity search & faceted directory
│   │   │   └── [slug]/page.tsx                # Individual opportunity leaf page (masked/unmasked)
│   │   ├── states/[state]/page.tsx            # State-specific landing pages (SEO hub)
│   │   ├── categories/[category]/page.tsx     # Category-specific landing pages (SEO hub)
│   │   ├── pricing/page.tsx                   # ₦3,500 30-Day Pass explanation & benefits
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── blog/
│   │       ├── page.tsx                       # Career advice, scholarship guides
│   │       └── [slug]/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                       # Candidate overview & saved jobs
│   │   │   ├── applications/page.tsx          # Application tracker
│   │   │   ├── profile/page.tsx               # Resume & profile management
│   │   │   └── subscription/
│   │   │       ├── page.tsx                   # Active status, validity countdown, receipts
│   │   │       ├── paystack/page.tsx          # Paystack checkout redirect/popup
│   │   │       └── bank-transfer/page.tsx     # Bank details & receipt upload form
│   ├── admin/
│   │   ├── layout.tsx                         # Admin layout with sidebar & role gate
│   │   ├── page.tsx                           # Executive metrics & MRR dashboard
│   │   ├── opportunities/
│   │   │   ├── page.tsx                       # Live opportunities manager
│   │   │   ├── new/page.tsx                   # Manual opportunity creation
│   │   │   ├── edit/[id]/page.tsx
│   │   │   └── review-queue/page.tsx          # Review stage for drafts/imports
│   │   ├── import-centre/
│   │   │   ├── page.tsx                       # Multi-source import dashboard
│   │   │   ├── csv/page.tsx                   # CSV file uploader & mapper
│   │   │   ├── json/page.tsx                  # JSON bulk ingestion
│   │   │   ├── raw-paste/page.tsx             # Unstructured text parser
│   │   │   └── feeds/page.tsx                 # RSS / API scheduled connector configs
│   │   ├── verifications/
│   │   │   └── page.tsx                       # Bank receipt verification audit desk
│   │   ├── users/page.tsx                     # User list & subscription inspector
│   │   ├── categories/page.tsx                # Taxonomies & Nigerian states/cities
│   │   ├── blog/page.tsx                      # Editorial CMS
│   │   └── settings/page.tsx                  # Bank account info, keys, pricing
│   └── api/
│       ├── webhooks/
│       │   └── paystack/route.ts              # HMAC-verified Paystack webhook
│       ├── receipts/
│       │   └── signed-url/route.ts            # Secure private receipt access
│       └── cron/
│           ├── expire-subscriptions/route.ts  # Daily cron to flag expired passes
│           └── poll-feeds/route.ts            # Scheduled RSS poller
├── components/
│   ├── ui/                                    # Buttons, inputs, modals, badges, cards
│   ├── layout/                                # Navbar, footer, admin sidebar
│   ├── jobs/                                  # JobCard, FilterSidebar, LockedPaywallCard
│   ├── payments/                              # PaystackButton, BankTransferUploadForm
│   └── admin/                                 # ReceiptViewerModal, ImportMappingTable
├── lib/
│   ├── supabase/
│   │   ├── client.ts                          # Browser client
│   │   ├── server.ts                          # Server client (cookies/sessions)
│   │   └── admin.ts                           # Service role client (bypasses RLS for secure jobs)
│   ├── paystack.ts                            # Paystack API helper & signature verifier
│   ├── sanitizers.ts                          # Contact detail maskers
│   └── seo/                                   # JSON-LD generators (Dual schema)
└── types/                                     # TypeScript database & domain interfaces
```

---

## 4. Crucial Data Flow & Business Logic Engines

### 4.1 Paywall Data Isolation & Server-Side Masking
To prevent security leaks, **employer contact information must NEVER be delivered to client browsers unless the requesting user possesses an active 30-day subscription.**

```
                               ┌────────────────────────────────────────────────────────┐
                               │     REQUEST: GET /jobs/senior-accountant-abuja         │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                                         Is user authenticated with Supabase?
                                                          │
                         ┌────────────────────────────────┴──────────────────────────────┐
                         │ YES                                                           │ NO
                         ▼                                                               ▼
        Check `user_subscriptions` table                                             Guest User
        Where user_id = auth.uid()                                                       │
        AND status = 'active'                                                            │
        AND expires_at > NOW()                                                           │
                         │                                                               │
          ┌──────────────┴──────────────┐                                                │
          │ YES                         │ NO                                             │
          ▼                             ▼                                                ▼
     [ MEMBER ]                   [ FREE USER ]                                          │
          │                             │                                                │
  Return Full DB Row:                   │                                                │
  - Public Details                      └───────────────────────┬────────────────────────┘
  - Unlocked Email                                              │
  - Unlocked Phone                                              ▼
  - Direct Application Link                      [ SERVER SANITIZATION ENGINE ]
  - Specific Instructions                        Strip Private Columns from memory:
                                                 - employer_email = null
                                                 - employer_phone = null
                                                 - application_instructions = null
                                                 - application_url = null
                                                 Render <LockedPaywallCard />
```

---

### 4.2 Paystack Automated Webhook Processing
The Paystack webhook ensures real-time activation without manual admin intervention:

```
[ Customer Completes Paystack Payment ]
                  │
                  ▼
[ Paystack Dispatches POST to /api/webhooks/paystack ]
                  │
                  ▼
[ Validate Header: x-paystack-signature ]
Compute HMAC-SHA512 of Raw Request Body with PAYSTACK_SECRET_KEY
                  │
        ┌─────────┴─────────┐
        │ Valid?            │
        ▼                   ▼
     [ YES ]              [ NO ] ──► Return 401 Unauthorized (Drop request)
        │
   Event == 'charge.success'?
        │
        ▼
Extract user_id, amount, reference from metadata
Verify amount == 350000 (₦3,500 in kobo)
                  │
                  ▼
[ Start Supabase Database Transaction ]
1. Insert / Update `payment_transactions`:
   - status: 'approved'
   - channel: 'paystack'
   - verified_at: NOW()
2. Insert / Update `user_subscriptions`:
   - status: 'active'
   - activated_at: NOW()
   - expires_at: NOW() + interval '30 days'
                  │
                  ▼
[ Dispatch Activation Email to User ]
                  │
                  ▼
Return HTTP 200 OK to Paystack
```

---

### 4.3 Direct Bank Transfer Verification State Machine
For manual bank transfers, the system strictly enforces human verification before access is granted:

```
                       ┌───────────────────────────────┐
                       │ User Uploads Receipt & Ref    │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ Payment Transaction Created   │
                       │ Status: 'pending_verification'│
                       │ Membership: INACTIVE          │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ Receipt File Stored in        │
                       │ Supabase Storage (Private)    │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ Admin Audits Bank Credit      │
                       └───────┬───────────────┬───────┘
                               │               │
                    [ Confirmed Credit ]   [ Unconfirmed / Fake ]
                               │               │
                               ▼               ▼
               ┌────────────────────────┐   ┌────────────────────────┐
               │ Admin Clicks 'Approve' │   │ Admin Clicks 'Reject'  │
               │ - Status: 'approved'   │   │ - Status: 'rejected'   │
               │ - Membership: ACTIVE   │   │ - Reason: Required     │
               │ - Duration: 30 Days    │   │ - Membership: INACTIVE │
               │   from NOW()           │   │ - Rejection Email Sent │
               │ - Approval Email Sent  │   └────────────────────────┘
               └────────────────────────┘
```

---

### 4.4 Multi-Source Content Ingestion & Review Pipeline
To feed the platform with high-volume opportunities across all 36 states and the FCT, the Import Centre provides a unified ingestion pipeline:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           IMPORT SOURCES                               │
  ├───────────────┬───────────────┬───────────────┬────────────────────────┤
  │ 1. Manual Form│ 2. CSV File   │ 3. JSON Array │ 4. Pasted Raw Text     │
  └───────┬───────┴───────┬───────┴───────┬───────┴───────────┬────────────┘
          │               │               │                   │
          └───────────────┼───────────────┴───────────────────┘
                          │
                          ▼
            [ Ingestion Normalizer Engine ]
            - Trim whitespace, clean HTML tags
            - Map Nigerian State to standardized enum
            - Separate Public Description from Private Application Dossier
                          │
                          ▼
            [ Insert into `opportunities` Table ]
            - Status: 'draft' or 'pending_review'
            - is_published: FALSE
                          │
                          ▼
            [ Admin Review Queue Workspace ]
            Admin can:
            - One-click approve and publish
            - Edit content or re-assign category
            - Pin as 'Featured Listing'
            - Delete spam / unverified records
                          │
                          ▼
               Status: 'published' (LIVE)
```

---

## 5. Security & Boundary Architecture

1. **Database Row-Level Security (RLS)**:
   - Built directly into Supabase PostgreSQL.
   - Public policies permit `SELECT` on `opportunities` where `status = 'published'`, but select queries exclude locked contact columns.
   - Admin routes use the Supabase Service Role key (isolated on the server) to retrieve and update private data.
2. **Private Storage Security**:
   - `payment-receipts` bucket is configured with `public = false`.
   - Users can only upload to their own user path (`/{user_id}/*`).
   - Admins generate short-lived signed URLs (15 minutes expiry) to view receipts during verification.
3. **Webhook Idempotency**:
   - Every transaction reference is stored with a unique constraint. Duplicate webhook calls from Paystack cannot trigger multiple 30-day extensions.
