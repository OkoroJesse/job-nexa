// ============================================================
// lib/aggregation/adapters/greenhouse.ts
// Fetches public job listings from Greenhouse ATS boards
// No auth required — Greenhouse board API is publicly accessible
// and explicitly designed for job board aggregation.
// ============================================================

import { AdapterResult, NormalizedJob, SourceConfig } from '../types';

interface GreenhouseJob {
  id: number;
  title: string;
  content?: string;
  updated_at: string;
  absolute_url: string;
  location?: { name: string };
  departments?: Array<{ name: string }>;
  offices?: Array<{ name: string; country_name?: string }>;
  metadata?: Array<{ name: string; value: unknown }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

function inferOpportunityType(title: string, content: string): string {
  const lower = (title + ' ' + content).toLowerCase();
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('graduate trainee') || lower.includes('grad trainee')) return 'graduate_trainee';
  if (lower.includes('nysc')) return 'nysc_ppa';
  if (lower.includes('contract')) return 'contract';
  if (lower.includes('part-time') || lower.includes('part time')) return 'part_time';
  return 'full_time';
}

function parseLocation(job: GreenhouseJob): { city: string | null; state_name: string | null } {
  const locationStr = job.location?.name ?? job.offices?.[0]?.name ?? '';
  if (!locationStr) return { city: null, state_name: null };

  const parts = locationStr.split(',').map((p) => p.trim());
  const city = parts[0] ?? null;
  const state_name = parts[1] ?? null;

  return { city, state_name };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

export async function fetchGreenhouseJobs(source: SourceConfig): Promise<AdapterResult> {
  const boardToken = (source.config.board_token as string) ?? '';
  const countryFilter = (source.config.country_filter as string[]) ?? [];

  if (!boardToken) {
    return { jobs: [], discovered_count: 0, error: 'Missing board_token in source config' };
  }

  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;

  let data: GreenhouseResponse;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'JobNexa-Aggregator/1.0 (job board aggregation)' },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return {
        jobs: [],
        discovered_count: 0,
        error: `Greenhouse API returned HTTP ${response.status} for board ${boardToken}`,
      };
    }

    data = (await response.json()) as GreenhouseResponse;
  } catch (err) {
    return {
      jobs: [],
      discovered_count: 0,
      error: `Network error fetching Greenhouse board ${boardToken}: ${String(err)}`,
    };
  }

  const allJobs: GreenhouseJob[] = data.jobs ?? [];
  const discovered_count = allJobs.length;

  // Apply country filter if configured
  const filtered =
    countryFilter.length === 0
      ? allJobs
      : allJobs.filter((job) => {
          const loc = (job.location?.name ?? '') + (job.offices?.map((o) => o.name).join(' ') ?? '');
          return (
            countryFilter.some((f) => loc.toLowerCase().includes(f.toLowerCase())) ||
            loc.toLowerCase().includes('remote') ||
            loc.toLowerCase().includes('nigeria')
          );
        });

  const jobs: NormalizedJob[] = filtered.map((job) => {
    const { city, state_name } = parseLocation(job);
    const rawContent = job.content ?? '';
    const cleanContent = stripHtml(rawContent);

    // Split description from requirements heuristically on common headers
    const reqMatch = cleanContent.match(
      /(requirements?|qualifications?|what you.ll need|what we.re looking for)/i,
    );
    let description = cleanContent;
    let requirements = '';
    if (reqMatch && reqMatch.index !== undefined) {
      description = cleanContent.slice(0, reqMatch.index).trim();
      requirements = cleanContent.slice(reqMatch.index).trim();
    }
    if (!requirements) requirements = 'See full job description for requirements.';

    return {
      title: job.title,
      organization_name: source.default_attribution ?? source.name,
      description: description || cleanContent,
      requirements,
      opportunity_type: inferOpportunityType(job.title, rawContent),
      city,
      state_name,
      application_url: job.absolute_url,
      source_identifier: String(job.id),
      source_url: job.absolute_url,
      source_name: source.name,
      original_published_at: job.updated_at,
      raw_source_data: job as unknown as Record<string, unknown>,
    };
  });

  return { jobs, discovered_count, error: null };
}
