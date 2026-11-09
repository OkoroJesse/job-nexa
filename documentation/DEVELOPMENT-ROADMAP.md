# Development Roadmap & Implementation Plan: JobNexa

**Target Timeline:** 6 Sprints (12 Weeks Total)  
**Methodology:** Agile / Scrum with Continuous Integration & Continuous Deployment (CI/CD)  
**Deliverables Target:** Production-Ready Nigerian Jobs & Opportunities Platform  

---

## 1. Master Phase Overview

```
Sprint 1 (Weeks 1-2)    Sprint 2 (Weeks 3-4)    Sprint 3 (Weeks 5-6)    Sprint 4 (Weeks 7-8)    Sprint 5 (Weeks 9-10)   Sprint 6 (Weeks 11-12)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Foundation & Auth   │ │ Admin Import Centre │ │ Public Discovery &  │ │ Dual Payment Rails  │ │ Candidate Hub &     │ │ Auditing, Hardening │
│ - Next.js Setup     │ │ - CSV/JSON Importers│ │   Faceted Search    │ │ - Paystack Gateway  │ │   Blog Engine       │ │   & Production      │
│ - Supabase Schema   │ │ - Raw Text Parser   │ │ - 36 States + FCT   │ │ - Bank Receipt Desk │ │ - Dual Schema SEO   │ │   Deployment        │
│ - RLS & Base RBAC   │ │ - Review Staging    │ │ - Locked View Card  │ │ - Admin Audit Desk  │ │ - Alerts System     │ │   Launch on Vercel  │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## 2. Sprint-by-Sprint Execution Breakdown

### Sprint 1: Project Foundation, Database Schema & Authentication (Weeks 1–2)
- **Objectives**: Initialize codebase, establish Supabase connection, execute SQL migrations, and configure authentication.
- **Tasks**:
  1. Initialize Next.js (App Router) project with TypeScript, ESLint, and Tailwind CSS.
  2. Provision Supabase project (PostgreSQL, GoTrue Auth, Storage).
  3. Execute database schema DDL migrations (`profiles`, `locations_states`, `categories`, `opportunities`, `user_subscriptions`, `payment_transactions`, `admin_audit_logs`).
  4. Seed 36 Nigerian States + FCT and core opportunity categories.
  5. Implement Supabase Auth (Email/Password, Magic Link, Google OAuth) with cookie session handling.
  6. Configure Role-Based Access Control (RBAC) middleware for `/admin/*` and `/dashboard/*`.
- **Milestone 1**: A user can register, log in, view their initial profile, and an admin can access a secured admin shell.

---

### Sprint 2: The Universal Job Import Centre & Staging Pipeline (Weeks 3–4)
- **Objectives**: Build the administrative data ingestion engine to populate the database with vetted opportunities.
- **Tasks**:
  1. Build manual opportunity creation form with rich text description and separate private contact fields.
  2. Implement CSV batch upload with column-mapping UI and data validation.
  3. Implement JSON bulk import endpoint.
  4. Build intelligent raw-text parser (extracts title, company, requirements, and contact data from unstructured pasted text).
  5. Implement the **Admin Review Queue**:
     - Imported items enter as `draft` or `pending_review`.
     - Admin moderation interface to batch-approve, edit, or reject listings before public publishing.
  6. Build category and location management CRUD screens.
- **Milestone 2**: Administrators can import 100+ opportunities daily from various formats and publish them through the review queue.

---

### Sprint 3: Public Portal, 36-State Faceted Search & Detail Page (Weeks 5–6)
- **Objectives**: Deliver a high-performance, mobile-first public discovery experience.
- **Tasks**:
  1. Build homepage with hero search, opportunity category pills, featured listings, and state directory.
  2. Build faceted directory (`/jobs`) with real-time filtering:
     - All 36 States + FCT.
     - Opportunity types (NYSC, Graduate Trainee, Scholarships, Remote USD, etc.).
     - Industry, experience, and salary filters.
  3. Build individual opportunity leaf page (`/jobs/[slug]`):
     - Public description, responsibilities, requirements, and deadline.
     - **The Locked Paywall Card**: displays benefit highlights and ₦3,500 upgrade CTA for free/guest users.
  4. Enforce server-side contact stripping: ensure private contact data is never sent in HTML/RSC payloads for locked views.
  5. Optimize Core Web Vitals for Nigerian mobile network conditions (MTN, Airtel, Glo).
- **Milestone 3**: Public users can search and view job descriptions across Nigeria, with private employer contacts securely locked.

---

### Sprint 4: Dual Payment Rails & Admin Receipt Verification Desk (Weeks 7–8)
- **Objectives**: Implement the core revenue engine with Paystack and manual bank transfer verification.
- **Tasks**:
  1. Build pricing page (`/pricing`) explaining the ₦3,500 30-Day All-Access Pass.
  2. **Paystack Integration**:
     - Paystack Pop / Standard checkout integration.
     - Serverless webhook handler (`/api/webhooks/paystack`) verifying HMAC-SHA512 signature.
     - Instant automated subscription activation upon `charge.success`.
  3. **Direct Bank Transfer Flow**:
     - Display official JobNexa corporate bank details and unique payment reference.
     - Receipt upload form with private Supabase Storage upload.
     - Create transaction record with status `pending_verification` (**membership remains strictly inactive**).
  4. **Admin Verification Audit Desk**:
     - Admin queue listing all pending bank transfer receipts.
     - Receipt viewer modal with short-lived presigned URLs (15-min TTL).
     - "Approve & Activate" action (starts 30-day clock from timestamp of approval).
     - "Reject" action with mandatory reason input and automated email dispatch.
  5. Implement daily automated cron job to transition expired subscriptions to `expired`.
- **Milestone 4**: Users can upgrade via Paystack (instant) or Bank Transfer (admin verified), unlocking contact details for exactly 30 days.

---

### Sprint 5: Candidate Hub, Editorial CMS & Dual SEO Architecture (Weeks 9–10)
- **Objectives**: Enhance user retention, organic search visibility, and candidate career management.
- **Tasks**:
  1. **Candidate Dashboard (`/dashboard`)**:
     - Active subscription status badge and 30-day validity countdown.
     - Saved / Bookmarked opportunities.
     - Personal Application Tracker (Applied, Interviewing, Offered).
     - Resume upload and profile management.
     - Transaction history and downloadable receipts.
  2. **Editorial CMS (Blog & Career Advice)**:
     - Admin markdown publisher for career guides, NYSC survival tips, and scholarship dossiers.
     - Public blog pages (`/blog` and `/blog/[slug]`).
  3. **Dual Schema SEO Engine**:
     - Inject `schema.org/JobPosting` JSON-LD exclusively for free/public opportunities.
     - Inject `schema.org/Article` or `schema.org/WebPage` for locked premium opportunities to avoid Google for Jobs penalties.
     - XML Sitemap generator covering all 36 States and opportunity categories.
- **Milestone 5**: Candidates have a complete personal hub, and the platform publishes search-optimized content safely.

---

### Sprint 6: Security Hardening, Performance QA & Production Launch (Weeks 11–12)
- **Objectives**: Rigorous quality assurance, penetration testing, performance optimization, and production deployment.
- **Tasks**:
  1. Security audit: verify RLS policies, inspect bundle payloads for contact leaks, test Paystack webhook spoofing defenses.
  2. Simulated bank transfer receipt fraud testing (verifying that no edge case auto-activates subscriptions).
  3. End-to-end responsiveness testing on physical low-end Android mobile devices.
  4. Production environment provisioning on Vercel and Supabase Pro.
  5. Domain configuration, SSL verification, and Paystack live keys activation.
  6. Final smoke testing and official platform launch.
- **Milestone 6**: Production platform live, secure, and processing verified memberships.

---

## 3. Risk Management & Mitigation Matrix

| Risk Identified | Severity | Probability | Mitigation Strategy |
|---|---|---|---|
| **Google for Jobs Policy Penalty** | High | Medium | Enforce architectural dual-schema rule: never attach `JobPosting` schema to locked premium listings. |
| **Fake Bank Transfer Receipts** | High | High | Invariant: upload creates `pending_verification` state only. Zero automatic activation. Admin cross-references bank statement credit before approval. |
| **Contact Info Scraping / Leaks** | High | Medium | Server-side sanitization in Next.js Server Components. Stripped at API/query level before serialization. |
| **Slow Mobile Loading in Nigeria** | Medium | High | Tailwind CSS tree-shaking, static page generation (ISR) for public directories, Next.js image optimization (WebP/AVIF), no heavy third-party ad scripts. |
| **Payment Webhook Failure** | Medium | Low | Webhook idempotency, logging of raw payloads, and manual transaction reconciliation desk in admin console. |
