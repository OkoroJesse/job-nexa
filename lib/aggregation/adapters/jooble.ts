// ============================================================
// lib/aggregation/adapters/jooble.ts
// Jooble Partner Search API adapter
// Requires JOOBLE_API_KEY env var (register free at jooble.org/api)
// Source is seeded as INACTIVE until key is configured.
// ============================================================

import { AdapterResult, NormalizedJob, SourceConfig } from '../types';

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  type: string;
  updated: string;
  link: string;
  company: string;
  id?: string;
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

function inferOpportunityType(type: string, title: string): string {
  const lower = (type + ' ' + title).toLowerCase();
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('graduate') || lower.includes('trainee')) return 'graduate_trainee';
  if (lower.includes('nysc')) return 'nysc_ppa';
  if (lower.includes('contract')) return 'contract';
  if (lower.includes('part')) return 'part_time';
  if (lower.includes('scholar')) return 'scholarship';
  if (lower.includes('fellowship')) return 'fellowship';
  return 'full_time';
}

function parseLocation(loc: string): { city: string | null; state_name: string | null } {
  if (!loc) return { city: null, state_name: null };
  const parts = loc.split(',').map((p) => p.trim());
  return { city: parts[0] ?? null, state_name: parts[1] ?? null };
}

export async function fetchJoobleJobs(source: SourceConfig): Promise<AdapterResult> {
  // API key must come from environment — never from source.config in browser
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    return {
      jobs: [],
      discovered_count: 0,
      error: 'JOOBLE_API_KEY environment variable is not set. Configure it in Vercel/server env to activate this source.',
    };
  }

  const location = (source.config.location as string) ?? 'Nigeria';
  const keywords = (source.config.keywords as string) ?? 'jobs Nigeria';
  const url = `https://jooble.org/api/${apiKey}`;

  let data: JoobleResponse;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JobNexa-Aggregator/1.0',
      },
      body: JSON.stringify({ keywords, location, resultsOnPage: 100 }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return {
        jobs: [],
        discovered_count: 0,
        error: `Jooble API returned HTTP ${response.status}`,
      };
    }

    data = (await response.json()) as JoobleResponse;
  } catch (err) {
    return {
      jobs: [],
      discovered_count: 0,
      error: `Network error fetching Jooble results: ${String(err)}`,
    };
  }

  const allJobs: JoobleJob[] = data.jobs ?? [];
  const discovered_count = data.totalCount ?? allJobs.length;

  const jobs: NormalizedJob[] = allJobs
    .filter((job) => job.link && job.title && job.company)
    .map((job) => {
      const { city, state_name } = parseLocation(job.location);
      const sourceId = job.id ?? Buffer.from(job.link).toString('base64').slice(0, 32);

      return {
        title: job.title,
        organization_name: job.company || 'Unknown Employer',
        description: job.snippet || 'See full job description at application link.',
        requirements: 'See full job description for requirements.',
        salary_or_stipend_range: job.salary || null,
        opportunity_type: inferOpportunityType(job.type, job.title),
        city,
        state_name,
        application_url: job.link,
        source_identifier: sourceId,
        source_url: job.link,
        source_name: source.name,
        original_published_at: job.updated ? new Date(job.updated).toISOString() : null,
        raw_source_data: job as unknown as Record<string, unknown>,
      };
    });

  return { jobs, discovered_count, error: null };
}
