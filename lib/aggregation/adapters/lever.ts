// ============================================================
// lib/aggregation/adapters/lever.ts
// Fetches public job listings from Lever ATS postings API
// No auth required — Lever public postings API is designed
// for display on external career sites and job boards.
// ============================================================

import { AdapterResult, NormalizedJob, SourceConfig } from '../types';

interface LeverPosting {
  id: string;
  text: string; // job title
  hostedUrl: string;
  applyUrl: string;
  createdAt: number; // Unix ms timestamp
  categories?: {
    location?: string;
    team?: string;
    commitment?: string; // "Full-time", "Part-time", etc.
    level?: string;
  };
  content?: {
    description?: string;
    descriptionHtml?: string;
    lists?: Array<{ text: string; content: string }>;
    closing?: string;
    closingHtml?: string;
  };
  tags?: string[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function inferOpportunityType(commitment: string, title: string): string {
  const lower = (commitment + ' ' + title).toLowerCase();
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('graduate trainee') || lower.includes('grad')) return 'graduate_trainee';
  if (lower.includes('contract')) return 'contract';
  if (lower.includes('part-time') || lower.includes('part time')) return 'part_time';
  return 'full_time';
}

function parseLocation(locationStr: string): { city: string | null; state_name: string | null } {
  if (!locationStr) return { city: null, state_name: null };
  const parts = locationStr.split(',').map((p) => p.trim());
  return { city: parts[0] ?? null, state_name: parts[1] ?? null };
}

export async function fetchLeverJobs(source: SourceConfig): Promise<AdapterResult> {
  const siteName = (source.config.site_name as string) ?? '';
  const countryFilter = (source.config.country_filter as string[]) ?? [];

  if (!siteName) {
    return { jobs: [], discovered_count: 0, error: 'Missing site_name in source config' };
  }

  const url = `https://api.lever.co/v0/postings/${siteName}?mode=json`;

  let postings: LeverPosting[];
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'JobNexa-Aggregator/1.0 (job board aggregation)' },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return {
        jobs: [],
        discovered_count: 0,
        error: `Lever API returned HTTP ${response.status} for site ${siteName}`,
      };
    }

    postings = (await response.json()) as LeverPosting[];
  } catch (err) {
    return {
      jobs: [],
      discovered_count: 0,
      error: `Network error fetching Lever postings for ${siteName}: ${String(err)}`,
    };
  }

  const discovered_count = postings.length;

  // Apply country / location filter
  const filtered =
    countryFilter.length === 0
      ? postings
      : postings.filter((p) => {
          const loc = p.categories?.location ?? '';
          return (
            countryFilter.some((f) => loc.toLowerCase().includes(f.toLowerCase())) ||
            loc.toLowerCase().includes('remote') ||
            loc.toLowerCase().includes('nigeria')
          );
        });

  const jobs: NormalizedJob[] = filtered.map((posting) => {
    const locationStr = posting.categories?.location ?? '';
    const { city, state_name } = parseLocation(locationStr);

    // Build description from content blocks
    const descHtml = posting.content?.descriptionHtml ?? posting.content?.description ?? '';
    const description = stripHtml(descHtml) || 'See full job description at application link.';

    // Build requirements from content lists
    const requirements =
      (posting.content?.lists ?? [])
        .map((list) => `${list.text}:\n${stripHtml(list.content)}`)
        .join('\n\n') || 'See full job description for requirements.';

    return {
      title: posting.text,
      organization_name: source.default_attribution ?? source.name,
      description,
      requirements,
      opportunity_type: inferOpportunityType(posting.categories?.commitment ?? '', posting.text),
      experience_level: posting.categories?.level ?? null,
      city,
      state_name,
      application_url: posting.applyUrl ?? posting.hostedUrl,
      source_identifier: posting.id,
      source_url: posting.hostedUrl,
      source_name: source.name,
      original_published_at: posting.createdAt
        ? new Date(posting.createdAt).toISOString()
        : null,
      raw_source_data: posting as unknown as Record<string, unknown>,
    };
  });

  return { jobs, discovered_count, error: null };
}
