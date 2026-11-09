# JobNexa — Automated Job Aggregation System Technical Architecture

This guide describes the technical design, adapter engine, deduplication mechanics, and scheduled execution architecture of JobNexa's automated job aggregation system.

---

## 1. System Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │            Vercel Cron                 │
                      │  0 */6 * * * (Every 6 hours)           │
                      └──────────────────┬─────────────────────┘
                                         │ Bearer CRON_SECRET
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    GET /api/cron/import-jobs           │
                      └──────────────────┬─────────────────────┘
                                         │ Internal POST
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    POST /api/admin/sources/run-all     │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│ Greenhouse ATS  │            │    Lever ATS    │            │ Jooble / RSS    │
│    Adapter      │            │     Adapter     │            │    Adapters     │
└───────┬─────────┘            └────────┬────────┘            └────────┬────────┘
        │                               │                              │
        └───────────────────────────────┼──────────────────────────────┘
                                        ▼
                      ┌────────────────────────────────────────┐
                      │  lib/aggregation/dedup.ts              │
                      │  computeDedupHash(title, org, url)     │
                      └──────────────────┬─────────────────────┘
                                         │
                        Duplicate Check vs Supabase
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
            [Hash Exists]                              [New Unique Hash]
                   │                                           │
         Increment Duplicates                         Insert Opportunity
          (Skip DB Mutation)                         status: 'pending_review'
                                                     (or 'published' if auto_publish)
                                                               │
                                                               ▼
                                                     Log to import_execution_logs
```

---

## 2. Directory Structure

```
lib/aggregation/
├── types.ts                    # Shared types: NormalizedJob, AdapterResult, SourceConfig
├── dedup.ts                    # Fast deterministic djb2 hashing for deduplication
├── importer.ts                 # Core orchestration: runs adapter, dedups, writes to DB & logs
└── adapters/
    ├── greenhouse.ts           # Greenhouse public boards API fetcher
    ├── lever.ts                # Lever public postings API fetcher
    ├── jooble.ts               # Jooble REST search API adapter
    └── rss.ts                  # Generic RSS 2.0 / Atom 1.0 feed fetcher

app/api/
├── admin/
│   ├── sources/
│   │   ├── route.ts            # GET all sources, POST new source
│   │   ├── run-all/route.ts    # POST batch run for scheduled/manual sync
│   │   └── [id]/
│   │       ├── route.ts        # GET single, PATCH update, DELETE
│   │       ├── test/route.ts   # POST test connection & sample preview
│   │       └── run/route.ts    # POST manual trigger for single source
│   └── import-logs/route.ts    # GET paginated execution logs
└── cron/
    ├── import-jobs/route.ts    # Vercel cron handler (6-hour interval)
    └── check-freshness/route.ts# Vercel cron handler for expiry (daily)
```

---

## 3. Deduplication Algorithm

Deduplication prevents multiple copies of the same listing from entering the review queue or published directory.

### Hash Generation (`lib/aggregation/dedup.ts`)
```typescript
function computeDedupHash(title: string, organizationName: string, applicationUrl: string): string {
  const normalised = [
    title.toLowerCase().trim(),
    organizationName.toLowerCase().trim(),
    applicationUrl.toLowerCase().trim().replace(/\?.*$/, ''), // strip UTM query parameters
  ].join('|').replace(/\s+/g, ' ');

  let hash = 5381;
  for (let i = 0; i < normalised.length; i++) {
    hash = (hash << 5) + hash + normalised.charCodeAt(i);
    hash = hash & hash;
  }
  const unsigned = (hash >>> 0).toString(16).padStart(8, '0');
  return `${unsigned}-${normalised.length.toString(16)}`;
}
```

### Invariants:
1. **Case-Insensitive**: `Software Engineer` and `software engineer` produce the same hash.
2. **Whitespace-Normalized**: Leading, trailing, and multi-space gaps are collapsed.
3. **UTM Stripping**: `?utm_source=linkedin&utm_medium=feed` is removed from URLs prior to hashing.
4. **Indexed in DB**: The `opportunities.dedup_hash` column is indexed (`idx_opportunities_dedup_hash`) for fast $O(1)$ lookups.

---

## 4. Source Adapter Pattern

Every adapter conforms to the `(source: SourceConfig) => Promise<AdapterResult>` interface:

```typescript
export interface AdapterResult {
  jobs: NormalizedJob[];
  error?: string | null;
  discovered_count: number;
}
```

### Implementing a New Adapter:
1. Create `lib/aggregation/adapters/<adapter_name>.ts`.
2. Implement the fetching logic with proper error handling and a 30-second abort signal timeout.
3. Map source data into `NormalizedJob[]` schema:
   - Never invent salary, location, or qualifications.
   - Clean HTML tags with regex or parser.
   - Infer `opportunity_type` using keywords (`internship`, `graduate_trainee`, `nysc_ppa`, etc.).
4. Add the new adapter case in `lib/aggregation/importer.ts` switch statement.

---

## 5. Cron Configuration & Security

Scheduled execution runs automatically through **Vercel Cron Jobs** configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/import-jobs",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/check-freshness",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Security Mechanism:
- Both `/api/cron/import-jobs` and `/api/cron/check-freshness` verify the `Authorization: Bearer <CRON_SECRET>` header.
- Vercel automatically injects `CRON_SECRET` when invoking configured cron routes.
- Unauthorized calls (e.g. without the secret or from third parties) receive HTTP 401.
