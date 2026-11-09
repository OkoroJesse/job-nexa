// ============================================================
// lib/aggregation/adapters/rss.ts
// Generic RSS/XML feed adapter
// Parses standard RSS 2.0 and Atom 1.0 feeds
// Only uses publicly accessible, authorised feeds
// ============================================================

import { AdapterResult, NormalizedJob, SourceConfig } from '../types';

/** Very lightweight XML tag extractor — no external dependencies */
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = re.exec(xml);
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
}

function extractAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    results.push(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
  }
  return results;
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

function inferOpportunityType(title: string, description: string): string {
  const lower = (title + ' ' + description).toLowerCase();
  if (lower.includes('scholar')) return 'scholarship';
  if (lower.includes('fellowship')) return 'fellowship';
  if (lower.includes('grant')) return 'grant';
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('nysc')) return 'nysc_ppa';
  if (lower.includes('graduate trainee') || lower.includes('grad trainee')) return 'graduate_trainee';
  if (lower.includes('vocational') || lower.includes('apprentice')) return 'vocational_training';
  if (lower.includes('contract')) return 'contract';
  if (lower.includes('part-time') || lower.includes('part time')) return 'part_time';
  return 'full_time';
}

export async function fetchRssJobs(source: SourceConfig): Promise<AdapterResult> {
  let xml: string;
  try {
    const response = await fetch(source.endpoint_url, {
      headers: {
        'User-Agent': 'JobNexa-Aggregator/1.0 (RSS feed aggregation)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return {
        jobs: [],
        discovered_count: 0,
        error: `RSS feed returned HTTP ${response.status} at ${source.endpoint_url}`,
      };
    }

    xml = await response.text();
  } catch (err) {
    return {
      jobs: [],
      discovered_count: 0,
      error: `Network error fetching RSS feed ${source.endpoint_url}: ${String(err)}`,
    };
  }

  // Parse items (RSS 2.0) or entries (Atom 1.0)
  const isAtom = xml.includes('<feed') && xml.includes('<entry');
  const itemTag = isAtom ? 'entry' : 'item';

  // Extract individual items
  const itemsRe = new RegExp(`<${itemTag}[^>]*>([\\s\\S]*?)<\\/${itemTag}>`, 'gi');
  const items: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemsRe.exec(xml)) !== null) {
    items.push(m[1]);
  }

  const discovered_count = items.length;

  const jobs: NormalizedJob[] = [];
  for (const item of items) {
    const title = stripHtml(extractTag(item, 'title'));
    const link = extractTag(item, isAtom ? 'id' : 'link') ||
      (() => {
        const lm = /<link[^>]*href="([^"]+)"/.exec(item);
        return lm ? lm[1] : '';
      })();
    const description = stripHtml(extractTag(item, isAtom ? 'summary' : 'description'));
    const pubDate = extractTag(item, isAtom ? 'published' : 'pubDate');
    const orgName = extractTag(item, 'author') ||
      source.default_attribution ||
      source.name;

    if (!title || !link) continue;

    jobs.push({
      title,
      organization_name: orgName,
      description: description || 'See full job details at the link provided.',
      requirements: 'See full job description for requirements.',
      opportunity_type: inferOpportunityType(title, description),
      application_url: link,
      source_identifier: link,
      source_url: link,
      source_name: source.name,
      original_published_at: pubDate ? new Date(pubDate).toISOString() : null,
      raw_source_data: { title, link, description, pubDate },
    });
  }

  return { jobs, discovered_count, error: null };
}
