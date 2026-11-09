# JobNexa — Authorised Job Source Integration Matrix

This document provides a comprehensive audit and specification of all external job sources supported or evaluated by JobNexa.

JobNexa operates as a legitimate, copyright-compliant aggregator. **Scraping restricted platforms (Jobberman, LinkedIn, Delon Jobs, Remotive) without written authorization is strictly prohibited.** Only publicly accessible employer ATS endpoints, authorized partner APIs, and open RSS feeds with proper attribution are integrated.

---

## 1. Integrated Sources Summary

| Source Name | Type | Endpoint / Interface | Nigerian Jobs | Commercial Republication | Attribution Requirement | Auth / Credentials | Status |
|---|---|---|---|---|---|---|---|
| **Flutterwave Careers** | Greenhouse ATS | `https://boards-api.greenhouse.io/v1/boards/flutterwave/jobs?content=true` | Yes (Lagos, Remote) | Permitted (Public ATS API) | Required | None (Public Board API) | **Active** |
| **Paystack Careers** | Lever ATS | `https://api.lever.co/v0/postings/paystack?mode=json` | Yes (Lagos, Remote) | Permitted (Public ATS API) | Required | None (Public Postings API) | **Active** |
| **Andela Careers** | Greenhouse ATS | `https://boards-api.greenhouse.io/v1/boards/andela/jobs?content=true` | Yes (Remote / Worldwide) | Permitted (Public ATS API) | Required | None (Public Board API) | **Active** |
| **Jooble Partner API** | REST API (POST) | `https://jooble.org/api/{JOOBLE_API_KEY}` | Yes (All 36 States + FCT) | Partner Agreement Required | Required | `JOOBLE_API_KEY` (Server Env) | **Configured (Inactive until key set)** |
| **Federal Civil Service (FCSC)** | RSS 2.0 | Public RSS Endpoint | Yes (Federal) | Public Gazette | Required | None | Ready for Admin Activation |
| **NYSC PPA Board** | RSS 2.0 | Public RSS / Atom Feed | Yes (Nationwide) | Public Notice | Required | None | Ready for Admin Activation |

---

## 2. Source-by-Source Technical Breakdown

### 2.1. Flutterwave Careers (Greenhouse ATS)
- **Type**: `greenhouse`
- **Endpoint**: `https://boards-api.greenhouse.io/v1/boards/flutterwave/jobs?content=true`
- **Method**: HTTP `GET`
- **Authentication**: None required. Greenhouse provides public JSON APIs for all company boards.
- **Data Normalisation**:
  - `title` -> `job.title`
  - `organization_name` -> `Flutterwave Careers via Official ATS Feed`
  - `application_url` -> `job.absolute_url` (direct Greenhouse hosted application link)
  - `opportunity_type` -> Inferred from title/description (`full_time`, `graduate_trainee`, `internship`)
  - `location` -> Extracted from `location.name` and offices
- **Rate Limit**: Max 30 requests/minute. Scheduled to poll once every 12 hours (720 min).
- **Compliance & Terms**: Greenhouse public job board endpoints are published specifically for external aggregation and partner syndication.

### 2.2. Paystack Careers (Lever ATS)
- **Type**: `lever`
- **Endpoint**: `https://api.lever.co/v0/postings/paystack?mode=json`
- **Method**: HTTP `GET`
- **Authentication**: None required. Lever provides public job feeds for customer career portals.
- **Data Normalisation**:
  - `title` -> `posting.text`
  - `organization_name` -> `Paystack Careers via Official ATS Feed`
  - `application_url` -> `posting.applyUrl` or `posting.hostedUrl`
  - `opportunity_type` -> Inferred from `categories.commitment`
  - `description` -> Parsed and HTML-stripped from `content.descriptionHtml`
  - `requirements` -> Extracted from `content.lists`
- **Rate Limit**: Max 30 requests/minute. Scheduled to poll once every 12 hours (720 min).
- **Compliance & Terms**: Lever public postings API is designed for third-party job board syndication.

### 2.3. Andela Careers (Greenhouse ATS)
- **Type**: `greenhouse`
- **Endpoint**: `https://boards-api.greenhouse.io/v1/boards/andela/jobs?content=true`
- **Method**: HTTP `GET`
- **Authentication**: None required.
- **Data Normalisation**: Country filter defaults to `["Nigeria", "Lagos", "Remote", "Worldwide"]`.
- **Compliance & Terms**: Permitted via Greenhouse public feed.

### 2.4. Jooble Partner Search API (Nigeria Opportunities)
- **Type**: `jooble`
- **Endpoint**: `https://jooble.org/api/`
- **Method**: HTTP `POST` with JSON payload `{ keywords, location: "Nigeria", resultsOnPage: 100 }`
- **Authentication**: `JOOBLE_API_KEY` passed in the URL path (`https://jooble.org/api/${process.env.JOOBLE_API_KEY}`).
- **Commercial Republication**: Free tier requires registration at `https://jooble.org/api`. Partner terms apply. Listings must link directly to the employer or Jooble redirection URL without iframe wrapping.
- **Current Status**: Seeded as `is_active: false` in database. Activated automatically once admin adds `JOOBLE_API_KEY` to Vercel/server environment variables and toggles active status in Admin Import Centre.

---

## 3. Disallowed Platforms (Strict Policy)

The following platforms are explicitly **disallowed** from automated crawling or scraping:
- **Jobberman Nigeria**: Terms of Service forbid automated data extraction. No public API available without enterprise syndication agreement.
- **LinkedIn / LinkedIn Jobs**: Strictly prohibits web scraping under Computer Fraud and Abuse Act (CFAA) legal precedent and ToS.
- **Delon Jobs**: No public open API. Scraping prohibited.
- **Remotive**: Paid API key required for full commercial redistribution; public endpoint is restricted.

---

## 4. How to Add a New Employer ATS Source

1. Check if the employer uses **Greenhouse** (look for `boards.greenhouse.io/<company>` URL) or **Lever** (`jobs.lever.co/<company>` URL).
2. For Greenhouse:
   - Board Token: `<company>`
   - Endpoint: `https://boards-api.greenhouse.io/v1/boards/<company>/jobs?content=true`
3. For Lever:
   - Site Name: `<company>`
   - Endpoint: `https://api.lever.co/v0/postings/<company>?mode=json`
4. In JobNexa Admin Dashboard:
   - Navigate to **Import Centre** -> **Job Sources**
   - Click **Add Source**
   - Enter name, select type (`greenhouse` or `lever`), paste endpoint URL
   - Set location filter (e.g., `Nigeria, Lagos, Remote`)
   - Click **Test** to preview connection
   - Toggle **Active** once verified.
