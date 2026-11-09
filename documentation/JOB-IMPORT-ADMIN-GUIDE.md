# JobNexa — Import Centre Administrator User Guide

This guide explains how platform administrators manage job sources, review imported opportunities, monitor automated synchronisation, and handle job freshness.

---

## 1. Accessing the Import Centre

1. Log into your JobNexa account at `/login`.
2. Ensure your account has an administrative role (`super_admin`, `admin`, or `moderator`).
3. Click your profile avatar in the navigation bar and select **Admin Dashboard** (or navigate to `/admin/import-centre`).

---

## 2. Navigating the 7 Import Centre Tabs

The upgraded Import Centre organizes job aggregation into 7 functional tabs:

### Tab 1: Job Sources
- View all configured ingestion sources (Greenhouse, Lever, Jooble, RSS).
- See each source's current status (`Active` / `Inactive`), last run timestamp, next scheduled poll, and total imported count.
- **Actions available**:
  - **Test**: Tests connection to the remote endpoint and previews 3 discovered jobs without writing to the database.
  - **Run Now**: Manually triggers an immediate ingestion cycle for that specific source.
  - **Active Toggle**: Instantly enable or pause scheduled polling for this source.
  - **Add Source**: Opens a modal to configure a new employer feed or API.

### Tab 2: Auto Imports
- Configure scheduling frequency and auto-publishing policies per source.
- **Auto-Publish Setting**:
  - `OFF` (Default): All imported jobs enter the **Pending Review** queue as drafts. Recommended for quality control.
  - `ON`: Trusted sources can automatically publish listings directly to the live platform.

### Tab 3: Pending Review (Review Queue)
- Displays all newly imported listings awaiting administrator moderation.
- Review employer details, location, job title, and application link.
- **Actions available**:
  - **Approve & Publish**: Immediately publishes the opportunity to the public JobNexa directory with contact details locked behind seeker membership.
  - **Trash (Discard)**: Deletes the staged opportunity if it fails quality or relevance guidelines.

### Tab 4: Published Jobs
- Displays recently published opportunities that originated from automated sources.
- Shows source attribution badge linking back to original feed terms.

### Tab 5: Expired Jobs
- Displays listings that have passed their `application_deadline` or have been marked inactive.
- Automatically populated by the nightly `/api/cron/check-freshness` job.

### Tab 6: Import History
- Audit log of every import execution.
- Shows timestamp, source name, status (`success`, `partial`, `failed`), total discovered, new jobs imported, and duplicates skipped.
- Includes pagination for reviewing past aggregation history.

### Tab 7: Manual Import
- Preserved legacy batch ingestion tools:
  - **Raw Text Parser**: Paste WhatsApp, email, or LinkedIn broadcasts for structured extraction.
  - **CSV Upload**: Bulk upload `.csv` files matching the schema.
  - **JSON Array**: Ingest structured JSON arrays.
  - **RSS / API URL**: One-off ad-hoc polling of an external XML feed.

---

## 3. Review Queue Quality Guidelines

When reviewing items in **Pending Review**:

1. **Employer Identification**: Ensure the organization name matches the actual employer (e.g., "Flutterwave" rather than a recruiter agency name, unless specified).
2. **Contact Email & Application Link**: Verify the URL points to a legitimate corporate career page or applicant tracking system.
3. **No Fabricated Information**:
   - If salary was not provided by the source, leave it blank. Never guess or fabricate compensation numbers.
   - If a job does not specify an expiration date, leave the deadline unset.

---

## 4. Production Database Migration Requirement

Before automated sync runs in production, make sure migration `20261109000005_automated_job_aggregation.sql` has been run in your Supabase SQL Editor:

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard/project/xhrmnetjymtgyfrgtseg).
2. In the left navigation, click **SQL Editor**.
3. Open or paste `supabase/migrations/20261109000005_automated_job_aggregation.sql`.
4. Click **Run**.
5. The `authorized_sources` table will be upgraded, source tracking columns added to `opportunities`, and initial company feeds (Flutterwave, Paystack, Andela) seeded.
