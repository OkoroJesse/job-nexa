# JobNexa: Executive Product Requirements Summary (PRD Summary)

**Document:** PRD Executive Summary  
**Target:** Stakeholders, Product Leads & Engineering Team  
**Platform:** JobNexa (Nigeria Jobs & Opportunities Platform)  

---

## 1. At A Glance

| Key Dimension | Specification |
|---|---|
| **Product Purpose** | Professional, scam-free jobs, scholarships, NYSC, and career opportunities platform covering Nigeria's 36 States + FCT and global remote roles. |
| **Monetization Model** | **Freemium Discovery + Paid Application Unlock**: Free job browsing; ₦3,500 one-off fee for a **30-Day All-Access Pass** to unlock direct employer contacts & application instructions. |
| **Subscription Renewal** | **No automatic renewal in V1** (avoids user friction with recurring card debits). |
| **Payment Gateways** | 1. **Paystack** (Instant automated activation) <br> 2. **Direct Bank Transfer** (Requires manual admin bank statement verification). |
| **Admin Rule (Critical)** | **A receipt upload NEVER automatically activates membership.** Admin must verify physical bank credit before activation. Membership runs strictly 30 days from confirmed activation. |
| **Opportunity Scope** | Corporate Jobs, Remote Jobs (USD/EUR), NYSC PPAs, Graduate Trainees, Internships, Scholarships, Fellowships, Grants, Training Programs. |
| **Admin Ingestion** | Manual Entry, CSV Batch, JSON Bulk, Pasted Text Parser, API/RSS Poller. **Mandatory review stage prior to publishing.** |
| **Core Tech Stack** | Next.js 14/15 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage), Paystack API, Vercel Hosting. |
| **Google Jobs Strategy** | Free/Open jobs use `schema.org/JobPosting`. Locked premium jobs use `schema.org/Article` / `WebPage` to avoid Google's "Pay-to-Apply" penalty and de-indexing. |

---

## 2. Core User & Business Flows

### A. The Job Seeker Journey
1. **Discover**: Job seeker lands on JobNexa, searches by state (e.g., Kano, Lagos, Rivers) or category (e.g., Graduate Trainee, Remote).
2. **Read**: Seeker reads full role requirements, responsibilities, and qualifications for free.
3. **Encounter Unlock CTA**: To see direct HR contact details, verified email, recruiter WhatsApp, and step-by-step submission dossiers, the seeker clicks *"Unlock with 30-Day Pass (₦3,500)"*.
4. **Pay**:
   - **Option A (Paystack)**: Pays with Card/USSD/Transfer; activated instantly.
   - **Option B (Bank Transfer)**: Transfers ₦3,500 to JobNexa corporate account; uploads receipt; waits for admin verification.
5. **Apply**: Unlocks all employer contact details and application instructions for 30 consecutive days.

### B. The Admin Verification Workflow
1. User uploads payment receipt for Bank Transfer.
2. System logs transaction with status `pending_verification`. Membership remains **INACTIVE**.
3. Administrator opens **Admin Payment Verification Desk**.
4. Admin audits submitted receipt against live bank account balance/statement.
5. If verified, admin clicks **"Approve & Activate"**:
   - Status updates to `approved`.
   - Subscription created: `status = 'active'`, `activated_at = NOW()`, `expires_at = NOW() + 30 days`.
   - Email alert sent to user.
6. If unverified, admin clicks **"Reject"** with mandatory note; user notified immediately.

### C. The Content Ingestion Pipeline
```
[ CSV File / JSON / Raw Pasted Text / RSS Feed ] 
                      │
                      ▼
        [ Ingestion & Normalizer Engine ]
                      │
                      ▼
    [ Database Staging Area: Status = 'draft' ]
                      │
                      ▼
          [ Admin Review & Quality Audit ]
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
   [ Approved ]              [ Rejected ]
         │                         │
         ▼                         ▼
  Status = 'published'     Deleted / Archived
```

---

## 3. Key Architectural Pillars

1. **Information Security & Leak Prevention**:
   - Employer contact details (`employer_email`, `employer_phone`, `application_instructions`, `direct_application_url`) are excluded from public database queries and protected by Supabase Row-Level Security (RLS) and server-side route handlers.
2. **High-Performance Low-Data Architecture**:
   - Tailored to Nigerian mobile data conditions: zero bloat, server-rendered Next.js components, fast CDN caching via Vercel edge network.
3. **SEO & Policy Safety**:
   - Strict separation of schema types to harvest Google search traffic while avoiding Google for Jobs penalties.
