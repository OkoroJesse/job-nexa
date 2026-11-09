# Security, Compliance & Anti-Fraud Architecture: JobNexa

**Classification:** Internal Confidential / Engineering & Security Specification  
**Regulatory Standards:** Nigeria Data Protection Act (NDPA 2023), NDPR, PCI-DSS Level 1 (via Paystack), Google Search Central Policies  
**Target:** Senior Engineers, Financial Auditors & Security Operations  

---

## 1. Threat Modeling & Core Security Invariants

JobNexa operates in a high-risk digital environment characterized by aggressive scraping bots, employment impersonation syndicates, and payment receipt forgery. To protect platform integrity and user trust, three non-negotiable security invariants are enforced:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          JOBNEXA SECURITY INVARIANTS                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. ZERO-LEAK CONTACT PRIVACY: Employer contact data must NEVER be sent over the │
│    network to unauthenticated or non-subscribed clients.                         │
│ 2. STRICT HUMAN AUDIT ON TRANSFERS: Receipt uploads NEVER grant access. Only    │
│    verified commercial bank ledger credit can trigger subscription activation.   │
│ 3. CRYPTOGRAPHIC PAYMENT AUTHENTICITY: All gateway events must be signed with   │
│    HMAC-SHA512 and processed idempotently.                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Information Leak Prevention & Contact Shielding

### 2.1 The Vulnerability: Client-Side Masking Flaws
A frequent mistake in freemium job boards is returning full records from the database to the browser and masking them using CSS (`blur()`) or React conditions (`{isSubscribed ? job.email : 'Locked'}`). Attackers simply inspect the network response or DOM tree to retrieve the hidden contact info.

### 2.2 JobNexa's Zero-Trust Server Sanitization Layer
JobNexa enforces masking exclusively at the **Server Component (RSC) and Server Action layer**:
1. When a user requests an opportunity leaf page (`/jobs/[slug]`):
   - The server verifies the caller's session via Supabase Auth.
   - The server queries `user_subscriptions` to confirm if `status = 'active'` AND `expires_at > NOW()`.
   - **If the user is NOT an active member**:
     The server explicitly strips:
     - `employer_email` ➔ replaced with `null`
     - `employer_phone` ➔ replaced with `null`
     - `application_url` ➔ replaced with `null`
     - `application_instructions` ➔ replaced with `null`
   - Only the sanitized payload is serialized into the React HTML stream.
2. Even if an attacker inspects raw HTML, JavaScript state (`__NEXT_DATA__` or RSC payload chunks), or network DevTools, the private contact details do not exist on the client device.

---

## 3. Payment Gateway Security (Paystack Integration)

### 3.1 HMAC-SHA512 Webhook Verification
All automated subscription updates triggered by Paystack must be validated using cryptographic signature matching.

```typescript
// lib/paystack-verifier.ts
import crypto from 'crypto';

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not defined in environment variables.');
  }

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
}
```

### 3.2 In-Flight Price Manipulation Defense
- The subscription price is hardcoded on the server (350,000 Kobo = ₦3,500.00).
- When Paystack returns a `charge.success` event, the webhook handler asserts:
  `payload.data.amount === 350000 && payload.data.currency === 'NGN'`
- Any transaction with an altered amount is immediately flagged as fraudulent and rejected.

### 3.3 Transaction Idempotency
- Every Paystack transaction reference is stored with a unique SQL constraint in `payment_transactions.reference`.
- If Paystack retries webhook delivery, the database catches the unique violation or updates idempotently, preventing double-crediting or duplicate duration extensions.

---

## 4. Bank Transfer Receipt Verification & Fraud Prevention

### 4.1 The Counterfeit Receipt Threat in Nigeria
In Nigeria, fraudsters routinely use:
- Fake bank alert apps (software that generates realistic-looking SMS or PDF alerts).
- Edited screenshots created in photo manipulation tools.
- Reusing one legitimate receipt across multiple accounts.

### 4.2 JobNexa's Human-in-the-Loop Defense Workflow
To defeat receipt fraud completely:

```
[ User Uploads Receipt ] 
           │
           ▼
[ Insert with status = 'pending_verification' ]
- Membership state: INACTIVE
- Clock timer: NOT STARTED
           │
           ▼
[ Audit Desk View for Finance Officer ]
Officer checks:
1. Exact Sender Bank & Name
2. System-generated Unique Reference Code
3. Corporate Commercial Banking App (e.g. Zenith / GTBank Business App)
           │
 ┌─────────┴─────────┐
 │ Confirmed in Bank?│
 ▼                   ▼
[ YES ]            [ NO ]
 │                   │
Admin Approves:    Admin Rejects:
- Status = 'approved' - Status = 'rejected'
- Subscription = 'active' - Reason logged (e.g. "Payment not on statement")
- 30-Day Clock Starts - User notified via email
```

### 4.3 Secure Object Storage & Access Controls
- Receipt files (images/PDFs) are uploaded directly to the private Supabase Storage bucket `payment-receipts`.
- Public access is disabled (`public = false`).
- Users can only upload files into their own folder: `payment-receipts/{auth.uid()}/*`.
- Admins inspect receipts through **short-lived signed URLs** with a maximum Time-To-Live (TTL) of **15 minutes**.
- Maximum file size: **5MB**. Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`.

---

## 5. Administrative Privilege Protection & RBAC

1. **Role Hierarchy**:
   - `super_admin`: Full system control, role assignment, financial settings.
   - `finance_auditor`: Review and approve/reject bank transfer receipts.
   - `moderator`: Review and publish opportunities; manage blog and categories.
2. **Supabase Service Role Key Protection**:
   - The `SUPABASE_SERVICE_ROLE_KEY` has full administrative power and bypasses all RLS policies.
   - It is strictly restricted to server-side environments (`process.env.SUPABASE_SERVICE_ROLE_KEY`) and is never prefixed with `NEXT_PUBLIC_`.
3. **Immutable Audit Logging**:
   - Every single manual action (approving a receipt, rejecting a receipt, overriding a subscription, publishing an opportunity) writes an immutable record to `admin_audit_logs` capturing admin ID, timestamp, target entity, and IP address.

---

## 6. Nigeria Data Protection Act (NDPA) & Privacy Compliance

- **Minimal Data Collection**: JobNexa collects only necessary identifiers (Email, Full Name, Phone, State of Residence, and uploaded CV).
- **Consent on Registration**: Explicit terms informing users of data processing policies and third-party transmission safeguards.
- **Right to Erasure (Account Deletion)**: Users can initiate account deletion from `/dashboard/profile`. Deleting the user triggers cascading deletion of profiles, saved opportunities, and uploaded CVs. Historical financial transactions are anonymized and retained solely for statutory tax/auditing compliance.

---

## 7. Google Search Central Policy & Anti-Deindexing Guardrails

### 7.1 Risk of Cloaking Penalties
Google strictly forbids displaying full application links to Googlebot to earn `JobPosting` rich snippets while hiding them from users behind a paywall. Google’s webmaster tools treat this as **cloaking**, which triggers a permanent manual action removing the site from search.

### 7.2 The JobNexa Policy Firewall
1. **Rule**: If `opportunity.is_locked = TRUE`, the page **MUST NOT** include `schema.org/JobPosting` structured data.
2. **Alternative Markup**: Locked pages render standard `schema.org/Article` or `schema.org/WebPage` metadata.
3. **Auditing**: Automated CI/CD integration tests verify that no leaf page with `is_locked = true` emits `JobPosting` JSON-LD tags.
