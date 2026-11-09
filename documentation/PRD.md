# Product Requirements Document (PRD): JobNexa

**Product Name:** JobNexa  
**Document Version:** 1.0.0  
**Status:** Approved for Architectural Design  
**Target Market:** Nigeria (All 36 States & FCT) + Remote / Global Opportunities  
**Primary Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage), Paystack, Vercel  

---

## 1. Executive Summary & Product Vision

### 1.1 Vision Statement
JobNexa is Nigeria's premier, scam-free jobs and opportunities platform, designed to bridge the severe information gap between ambitious Nigerian job seekers and verified domestic and global opportunities. By combining modern digital experience design, comprehensive nationwide coverage (all 36 states and the FCT), and a strictly verified pay-to-unlock model, JobNexa provides job seekers with authentic, direct access to verified employers, graduate trainee intakes, NYSC placements, international remote roles, scholarships, and grants.

### 1.2 Core Business Model & Value Proposition
- **Free Discovery**: Anyone can register for free, browse all job listings, read full job descriptions, responsibilities, salary ranges, and requirements.
- **Fair-Price Unlock Pass**: To unlock direct employer contact details (direct HR emails, verified recruiter WhatsApp desks, phone contacts) and granular application instructions, users purchase a **30-Day All-Access Pass for ₦3,500**.
- **No Recurring Debits (V1)**: One-time payment model for 30 days. No recurring charges, honoring the Nigerian consumer's need for transparent financial control.
- **Dual Payment Rail**:
  1. *Paystack*: Instant automated activation via verified cards, USSD, bank transfer, and Apple Pay.
  2. *Direct Bank Transfer*: Manual transfer to JobNexa corporate account with proof-of-payment receipt upload. Manual admin confirmation of bank ledger credit is strictly required before activation.

---

## 2. User Personas & Ecosystem Actors

```
                                  ┌───────────────────────────┐
                                  │      JOBNEXA ACTORS       │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
        ┌────────┴────────┐            ┌────────┴────────┐            ┌────────┴────────┐
        │   JOB SEEKER    │            │  ADMINISTRATOR  │            │    EMPLOYER     │
        │ (Free & Member) │            │  (Ops & Finance)│            │  (Direct/Vetted)│
        └─────────────────┘            └─────────────────┘            └─────────────────┘
```

### 2.1 Persona A: Tunde - The Recent Graduate & NYSC Corps Member
- **Demographics:** 23 years old, deployed to Ogun State for NYSC, BSc Economics.
- **Pain Point:** Frustrated by scam job offers on social media; desperate for a verified Place of Primary Assignment (PPA) that pays a stipend and offers real professional experience.
- **JobNexa Journey:** Browses NYSC PPA listings in Ogun and Lagos. Upgrades for ₦3,500 using direct OPay bank transfer. Receives admin approval within 4 hours. Directly contacts HR via verified phone and email, securing an interview.

### 2.2 Persona B: Chidinma - Mid-Level Professional Seeking Remote / Global Work
- **Demographics:** 29 years old, Customer Support Specialist in Lagos.
- **Pain Point:** High cost of living and Naira devaluation; seeks remote roles paying in USD or scholarships for European master's programmes.
- **JobNexa Journey:** Finds curated remote international customer operations openings and Erasmus Mundus scholarship dossiers. Pays ₦3,500 via Paystack card payment. Instantly unlocks direct hiring manager submission dossiers.

### 2.3 Persona C: Mallam Ibrahim - Administrator & Verification Auditor
- **Role:** Super Admin / Financial Officer at JobNexa.
- **Responsibilities:** Audits bank receipts against commercial bank statement; approves or rejects subscriptions; imports 200+ vetted opportunities daily via CSV, RSS, or AI raw-text parser; ensures zero spam listings go live.

---

## 3. Comprehensive Functional Requirements

### 3.1 Public Opportunity Portal (Guest & Free User)
- **FR-PUB-01: Responsive Multi-Device UI**: Fast, mobile-first responsive layout optimized for low-bandwidth mobile networks in Nigeria.
- **FR-PUB-02: Universal Opportunity Directory**:
  - Full catalog covering: Corporate Jobs, Remote Jobs, NYSC PPAs, Graduate Trainee Programmes, Internships, Scholarships, Fellowships, Grants, and Vocational Training.
- **FR-PUB-03: Real-Time Faceted Search & Filters**:
  - Filter by **Geographic State** (All 36 Nigerian States + FCT + Remote + International).
  - Filter by **Opportunity Type** (Full-time, Part-time, Contract, NYSC, Internship, Scholarship, Grant).
  - Filter by **Industry / Sector** (Banking/Fintech, Oil & Gas, Healthcare, Education, Tech, Agriculture, Public Sector).
  - Filter by **Experience Level** (Entry, Mid, Senior, Executive, Student).
  - Filter by **Salary / Funding Range**.
- **FR-PUB-04: Public Opportunity Detail View (Leaf Page)**:
  - Displays: Title, Organization Name, Industry, Location, Remote Policy, Employment Type, Comprehensive Job Description, Key Responsibilities, Requirements, and Application Deadline.
  - **The Locked Application Block**:
    - If user is **Not Authenticated**: Displays CTA button *"Log In / Register to Unlock Application Details"*.
    - If user is **Free Registered (No Active Subscription)**: Displays high-converting Paywall Card:
      - *"Direct Employer Contact & Application Instructions are Locked."*
      - Outlines benefits: Direct HR email, verified recruiter phone/WhatsApp, specialized application link, interview guide.
      - CTA: *"Upgrade to 30-Day Pro for ₦3,500"*.
    - If user has **Active 30-Day Membership**: Displays full unlocked details (Direct Email, Physical Address, Recruiter Phone/WhatsApp, Official Career Link, Specific Email Subject Line Requirements).

---

### 3.2 Authentication & User Account Management
- **FR-AUTH-01: Supabase Auth Integration**:
  - Email + Password registration and Magic Link authentication.
  - Social Auth: Google One-Tap Sign-In.
  - Automatic email confirmation dispatch.
- **FR-AUTH-02: User Profile & Candidate Hub**:
  - Manage personal details: Name, Phone Number, State of Residence, Educational Level, Current Employment Status, Target Industries.
  - Upload & manage candidate CV/Resume (stored in secure Supabase Storage).
  - Bookmark / Save opportunities for later reference.
  - Application Tracker: Mark jobs as "Applied", "Interviewing", "Offered", or "Archived".

---

### 3.3 Subscription, Payment & Membership Engine

```
                             ┌───────────────────────────────────┐
                             │    MEMBERSHIP PAYMENT WORKFLOW    │
                             └─────────────────┬─────────────────┘
                                               │
                                Select Payment Method (₦3,500)
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
               [ PAYSTACK GATEWAY ]                         [ DIRECT BANK TRANSFER ]
                        │                                             │
               Card / USSD / Bank Transfer                   Pay to JobNexa Bank Account
                        │                                             │
               Paystack Processed                            User Uploads Bank Receipt
                        │                                             │
             Webhook Received (HMAC-512)                     Status = 'pending_verification'
                        │                                             │
             Status = 'active' (INSTANT)                     Admin Audits Bank Credit Ledger
                        │                                             │
                        │                                    ┌────────┴────────┐
                        │                                    │                 │
                        │                             [ APPROVED ]       [ REJECTED ]
                        │                                    │                 │
                        │                             Status = 'active'  Status = 'rejected'
                        │                                    │           Reason logged
                        │                                    │           User notified
                        └──────────────────────┬─────────────┘
                                               │
                                  ACTIVE 30-DAY MEMBERSHIP
                                  Valid until (Now + 30 Days)
                                  Unlocked Access Enabled
```

- **FR-PAY-01: Membership Duration Rule**:
  - Membership is valid for exactly **30 calendar days** from the timestamp of confirmed activation (`activated_at + interval '30 days'`).
  - Access expires automatically at `expires_at` without charging the user's card.
- **FR-PAY-02: Paystack Gateway Integration**:
  - Secure checkout using Paystack Pop / Standard redirect.
  - Supported channels: Debit Card (Mastercard, Visa, Verve), USSD, Bank Transfer, Apple Pay.
  - Server-side Webhook handler (`/api/webhooks/paystack`) verifying `x-paystack-signature` via HMAC-SHA512.
  - Automatic, instant transition of subscription status to `active`.
- **FR-PAY-03: Direct Bank Transfer & Proof-of-Payment Receipt Workflow**:
  - User is presented with official JobNexa corporate bank details (Bank Name, Account Number, Account Name, Reference Code).
  - User submits transfer details: Sender Name, Sender Bank, Transaction Date, Amount Paid (₦3,500), and uploads the receipt file (PNG, JPG, PDF; max 5MB).
  - **NON-NEGOTIABLE SECURITY INVARIANT**:
    - The submission creates a `payment_transactions` record with status `pending_verification`.
    - **Under no circumstances does receipt submission grant immediate membership access.**
    - The user's membership state remains `inactive` until explicitly confirmed by an administrator.
- **FR-PAY-04: Admin Bank Verification Desk**:
  - Dedicated administrative dashboard filtering all `pending_verification` receipts.
  - Admin previews receipt image/document side-by-side with submitted metadata.
  - Admin verifies credit in JobNexa's commercial banking application / statement.
  - Admin actions:
    - **Approve**: Sets transaction status to `approved`, creates/extends user's subscription record for 30 days starting from `NOW()`, and dispatches an immediate approval notification email/SMS.
    - **Reject**: Prompts admin for mandatory rejection reason (e.g., "Payment not credited to bank account", "Receipt invalid/blurry", "Underpayment"). Sets transaction to `rejected` and notifies user.
- **FR-PAY-05: Manual Subscription Override & Extension**:
  - Super Administrator possesses the capability to manually grant, extend, or revoke access for customer support or VIP grants with an immutable audit log.

---

### 3.4 Administration Console & Operations Centre

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             JOBNEXA ADMIN CONSOLE                                │
├──────────────┬──────────────────┬──────────────────┬──────────────┬──────────────┤
│ 1. Dashboard │ 2. Import Centre │ 3. Opportunities │ 4. Finance   │ 5. System    │
│    Analytics │    CSV/JSON/RSS  │    Moderation    │    Audit     │    Settings  │
└──────────────┴──────────────────┴──────────────────┴──────────────┴──────────────┘
```

- **FR-ADM-01: Role-Based Access Control (RBAC)**:
  - Role hierarchy: `super_admin`, `admin`, `moderator`, `finance_auditor`.
  - Enforced via Supabase RLS and server-side route guards.
- **FR-ADM-02: The Universal Job & Opportunity Import Centre**:
  - **Manual Entry Form**: Rich text editor, state/city selector, opportunity type selector, and segregated Public vs. Locked contact fields.
  - **CSV Batch Import**: Template download, multi-row parsing, header mapping, validation of required fields, and bulk draft insertion.
  - **JSON Bulk Import**: Accepts structured JSON arrays for developer-level data imports.
  - **Pasted Raw Text Ingestion**: Intelligent parser splitting pasted text into Title, Company, Description, Location, and Application Instructions.
  - **Automated RSS / API Feed Connectors**: Scheduled polling of authorized opportunity feeds into an incoming staging table.
  - **Mandatory Review & Staging Pipeline**:
    - **All imported records enter the database with status `draft` or `pending_review`.**
    - Bulk review interface allowing admins to approve, edit, tag, feature, or delete items before making them `published`.
- **FR-ADM-03: Opportunity Lifecycle Management**:
  - Search, edit, unpublish, duplicate, or delete live opportunities.
  - Toggle `is_featured` flag to pin opportunities to homepage and category banners.
  - Set explicit `expires_at` deadlines for automated unpublishing.
- **FR-ADM-04: Taxonomy & Location Management**:
  - Full management of Nigerian States (36 + FCT), LGAs, major cities, and custom regions.
  - Opportunity categories, industries, and tags.
- **FR-ADM-05: User & Membership Management**:
  - Search users by email, name, phone, or subscription status.
  - View subscription history, payment transaction logs, and uploaded receipts.
  - Ban / Deactivate suspicious accounts.
- **FR-ADM-06: Editorial CMS (Blog & Career Advisory)**:
  - Publish career articles, interview preparation guides, scholarship tips, and NYSC survival guides to boost organic SEO.
- **FR-ADM-07: Analytics & Executive Dashboard**:
  - Total registered users, active 30-day subscribers, gross subscription revenue (Monthly Recurring Equivalent), Paystack vs Bank Transfer split.
  - Verification turnaround time for bank transfers.
  - Most viewed categories and highest converting job posts.
- **FR-ADM-08: System & Platform Settings**:
  - Configure company bank details displayed to users (Bank Name, Account Number, Account Name, Instructions).
  - Set subscription fee (defaults to ₦3,500).
  - Configure Paystack public/secret keys.
  - Toggle maintenance mode.

---

## 4. Google Jobs Structured Data Strategy & Policy Compliance

### 4.1 Strict Policy Conflict Analysis
- **Google Search Central Guidelines on JobPosting**:
  - *"We do not allow job postings that require payment to apply, or where accessing the job application requires a fee."*
  - *"Job postings with misleading or missing application methods are subject to manual actions."*
- **Compliance Mandate**:
  - Applying `JobPosting` schema to JobNexa's premium locked listings risks algorithmic penalties or direct manual action, which would strip JobNexa from Google for Jobs search cards.

### 4.2 JobNexa's Dual-Structured-Data Architecture
1. **Public / Open Opportunities (`is_locked = false`)**:
   - For all public civil service postings, free NGO roles, and open university scholarships, JobNexa injects full `schema.org/JobPosting` structured JSON-LD into the HTML `<head>`.
   - Populated with `title`, `description`, `datePosted`, `validThrough`, `employmentType`, `hiringOrganization`, `jobLocation`, and `directApply = true`.
   - Generates high-volume traffic from Google for Jobs SERP widgets.
2. **Premium Locked Opportunities (`is_locked = true`)**:
   - The platform strictly **OMITS** `schema.org/JobPosting`.
   - Instead, the platform injects `schema.org/Article`, `schema.org/WebPage`, or `schema.org/SpecialAnnouncement`.
   - Google indexes the comprehensive job description, role overview, and requirements in standard web search results without violating JobPosting paywall guidelines.

---

## 5. Non-Functional & Operational Requirements

### 5.1 Performance & Mobile Optimization (Targeting Nigerian Network Realities)
- **NFR-PERF-01**: First Contentful Paint (FCP) < 1.2s and Largest Contentful Paint (LCP) < 2.2s on mid-tier mobile devices running on 3G/4G Nigerian mobile networks.
- **NFR-PERF-02**: Core Web Vitals compliance (CLS < 0.05). Zero third-party intrusive ad scripts causing layout shifts.
- **NFR-PERF-03**: Low data mode: aggressive caching of static assets, WebP/AVIF image formats, and optimized Tailwind CSS bundle (< 45KB gzip).

### 5.2 Security & Data Protection
- **NFR-SEC-01**: Enforce Supabase Row-Level Security (RLS) on all PostgreSQL tables.
- **NFR-SEC-02**: Restrict private employer contact data from client bundles; locked contact info must only be returned by server components or authenticated endpoints if the user has an active subscription.
- **NFR-SEC-03**: Secure private document storage: Payment receipts and user resumes stored in private Supabase Storage buckets, accessible solely via signed URLs with 15-minute TTLs.
- **NFR-SEC-04**: Nigeria Data Protection Regulation (NDPR) / Nigeria Data Protection Act (NDPA) compliance for user identity and phone number privacy.

---

## 6. Acceptance Criteria Matrix

| Feature | Acceptance Criteria |
|---|---|
| **Public Browsing** | Unauthenticated and free users can view full job descriptions, categories, and locations, but contact information and application instructions are replaced with the locked paywall card. |
| **Paystack Payment** | Successful card payment triggers Paystack webhook; subscription status immediately becomes `active`; `expires_at` is set to `activated_at + 30 days`; user instantly views unlocked application details. |
| **Bank Transfer Upload** | User uploads receipt; transaction record is created with status `pending_verification`; **user membership remains inactive**; admin receives pending verification alert. |
| **Admin Bank Verification** | Admin clicks "Approve"; transaction status updates to `approved`; user's subscription updates to `active` with `expires_at = NOW() + interval '30 days'`; confirmation email is sent; user can now access all locked application details. |
| **Admin Bank Rejection** | Admin clicks "Reject" with reason; transaction status updates to `rejected`; user membership remains inactive; notification email explaining the rejection reason is sent. |
| **Job Import Review** | Records imported via CSV, JSON, or paste enter as `draft`; cannot be viewed by public until an admin explicitly reviews and sets status to `published`. |
| **SEO Compliance** | Premium locked pages do not emit `JobPosting` schema; free public pages emit valid Google-compliant `JobPosting` JSON-LD. |

---

## 7. Future Expansion Roadmap (V2 & V3 Preview)
- **V2: Employer Self-Serve Portal**: Direct B2B recruiter job posting with pay-per-post or corporate monthly tiers.
- **V2: Automated Recurring Subscriptions**: Opt-in tokenized recurring card debits via Paystack for power users.
- **V3: AI CV Tailoring & Application Assistant**: Generative tool optimizing candidate resumes against specific job requirements.
- **V3: WhatsApp Alerts Bot**: Instant WhatsApp notification of new opportunities matching user's state and category.
