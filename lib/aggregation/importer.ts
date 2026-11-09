// ============================================================
// lib/aggregation/importer.ts
// Core import engine — takes a source, runs its adapter,
// deduplicates against the DB, and writes new jobs as
// pending_review (or published if source has auto_publish=true)
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { SourceConfig, NormalizedJob, ImportResult } from './types';
import { computeDedupHash } from './dedup';
import { fetchGreenhouseJobs } from './adapters/greenhouse';
import { fetchLeverJobs } from './adapters/lever';
import { fetchJoobleJobs } from './adapters/jooble';
import { fetchRssJobs } from './adapters/rss';

// Use service role key — this runs only on the server
function getServiceClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role credentials not configured');
  return createClient(url, key) as any;
}

/** Resolve the state_id from a human-readable state name */
async function resolveStateId(
  supabase: any,
  stateName: string | null | undefined,
): Promise<string | null> {
  if (!stateName) return null;
  const { data } = await supabase
    .from('location_states')
    .select('id')
    .ilike('name', `%${stateName.trim()}%`)
    .limit(1)
    .single();
  return (data as any)?.id ?? null;
}

/** Resolve the default category id for a source, with fallback to any existing category */
async function resolveDefaultCategoryId(
  supabase: any,
  sourceCategoryId: string | null,
): Promise<string | null> {
  if (sourceCategoryId) return sourceCategoryId;
  const { data } = await supabase
    .from('categories')
    .select('id')
    .order('sort_order', { ascending: true })
    .limit(1)
    .single();
  return (data as any)?.id ?? null;
}

/** Check whether a dedup hash already exists in the DB */
async function hashExists(
  supabase: any,
  hash: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('opportunities')
    .select('id')
    .eq('dedup_hash', hash)
    .limit(1)
    .single();
  return !!data;
}

/** Map a NormalizedJob to an opportunity DB row */
async function normalizedJobToRow(
  supabase: any,
  job: NormalizedJob,
  sourceId: string,
  categoryId: string | null,
  autoPublish: boolean,
): Promise<Record<string, unknown>> {
  const stateId = await resolveStateId(supabase, job.state_name);
  const hash = computeDedupHash(job.title, job.organization_name, job.application_url);

  // Slug: title-org-randomhex
  const slugBase = `${job.title}-${job.organization_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const slug = `${slugBase}-${hash.slice(0, 6)}`;

  const opportunityType = job.opportunity_type as string;
  const workplacePolicy = (() => {
    const city = (job.city ?? '').toLowerCase();
    const loc = (job.state_name ?? '').toLowerCase();
    if (city.includes('remote') || loc.includes('remote')) return 'remote_global';
    if (!stateId && !city) return 'remote_nigeria';
    return 'on_site';
  })();

  return {
    title: job.title,
    slug,
    organization_name: job.organization_name,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits ?? null,
    salary_or_stipend_range: job.salary_or_stipend_range ?? null,
    opportunity_type: opportunityType,
    experience_level: job.experience_level ?? null,
    workplace_policy: workplacePolicy,
    category_id: categoryId,
    state_id: stateId,
    city: job.city,
    application_deadline: job.application_deadline ?? null,
    application_url: job.application_url,
    is_locked: true, // contact info locked behind membership
    is_featured: false,
    status: autoPublish ? 'published' : 'pending_review',
    published_at: autoPublish ? new Date().toISOString() : null,
    // Source tracking
    source_id: sourceId,
    source_name: job.source_name,
    source_identifier: job.source_identifier,
    source_url: job.source_url ?? null,
    dedup_hash: hash,
    last_verified_at: new Date().toISOString(),
    verification_status: 'active',
    raw_source_data: job.raw_source_data ?? null,
  };
}

export async function runSourceImport(
  source: SourceConfig & {
    id: string;
    auto_publish: boolean;
    default_category_id: string | null;
  },
  triggeredBy: 'scheduler' | 'manual_admin' = 'scheduler',
  adminId?: string | null,
): Promise<ImportResult> {
  const supabase = getServiceClient();
  const categoryId = await resolveDefaultCategoryId(supabase, source.default_category_id ?? null);

  // 1. Create a running log entry
  const { data: logRow, error: logErr } = await supabase
    .from('import_execution_logs')
    .insert({
      source_id: source.id,
      source_name: source.name,
      status: 'running',
      triggered_by: triggeredBy,
      admin_id: adminId ?? null,
    })
    .select('id')
    .single();

  const logId: string | null = logRow?.id ?? null;

  const updateLog = async (patch: Record<string, unknown>) => {
    if (!logId) return;
    await supabase.from('import_execution_logs').update(patch).eq('id', logId);
  };

  if (logErr) {
    console.error('[Importer] Failed to create log entry:', logErr);
  }

  // 2. Fetch jobs from appropriate adapter
  let adapterResult;
  try {
    switch (source.source_type) {
      case 'greenhouse':
        adapterResult = await fetchGreenhouseJobs(source);
        break;
      case 'lever':
        adapterResult = await fetchLeverJobs(source);
        break;
      case 'jooble':
        adapterResult = await fetchJoobleJobs(source);
        break;
      case 'rss':
      case 'json_api':
      case 'partner_api':
        adapterResult = await fetchRssJobs(source);
        break;
      default:
        adapterResult = { jobs: [], discovered_count: 0, error: `Unknown source_type: ${source.source_type}` };
    }
  } catch (err) {
    const errMsg = String(err);
    await updateLog({
      status: 'failed',
      completed_at: new Date().toISOString(),
      errors_count: 1,
      error_details: { message: errMsg },
    });
    await supabase
      .from('authorized_sources')
      .update({ last_poll_status: 'error', last_error_message: errMsg, last_polled_at: new Date().toISOString() })
      .eq('id', source.id);
    return {
      source_id: source.id,
      source_name: source.name,
      discovered_count: 0,
      imported_count: 0,
      duplicates_count: 0,
      errors_count: 1,
      error_details: { message: errMsg },
      status: 'failed',
    };
  }

  if (adapterResult.error && adapterResult.jobs.length === 0) {
    await updateLog({
      status: 'failed',
      completed_at: new Date().toISOString(),
      discovered_count: adapterResult.discovered_count,
      errors_count: 1,
      error_details: { message: adapterResult.error },
    });
    await supabase
      .from('authorized_sources')
      .update({
        last_poll_status: 'error',
        last_error_message: adapterResult.error,
        last_polled_at: new Date().toISOString(),
        next_scheduled_poll_at: new Date(
          Date.now() + (source.config.import_frequency_minutes as number ?? 1440) * 60_000,
        ).toISOString(),
      })
      .eq('id', source.id);
    return {
      source_id: source.id,
      source_name: source.name,
      discovered_count: adapterResult.discovered_count,
      imported_count: 0,
      duplicates_count: 0,
      errors_count: 1,
      error_details: { message: adapterResult.error },
      status: 'failed',
    };
  }

  // 3. Deduplication and import
  let imported_count = 0;
  let duplicates_count = 0;
  let errors_count = 0;
  const errorDetails: unknown[] = [];

  for (const job of adapterResult.jobs) {
    try {
      const hash = computeDedupHash(job.title, job.organization_name, job.application_url);
      const isDuplicate = await hashExists(supabase, hash);

      if (isDuplicate) {
        duplicates_count++;
        continue;
      }

      const row = await normalizedJobToRow(supabase, job, source.id, categoryId, source.auto_publish);
      const { error: insertErr } = await supabase.from('opportunities').insert(row);

      if (insertErr) {
        errors_count++;
        errorDetails.push({ job: job.title, error: insertErr.message });
      } else {
        imported_count++;
      }
    } catch (err) {
      errors_count++;
      errorDetails.push({ job: job.title, error: String(err) });
    }
  }

  // 4. Update source stats
  const finalStatus = errors_count > 0 && imported_count === 0 ? 'failed' : errors_count > 0 ? 'partial' : 'success';

  await supabase
    .from('authorized_sources')
    .update({
      last_polled_at: new Date().toISOString(),
      last_poll_status: finalStatus,
      last_error_message: errorDetails.length > 0 ? JSON.stringify(errorDetails[0]) : null,
      total_imported_records: supabase.rpc ? undefined : undefined, // incremented below via raw
    })
    .eq('id', source.id);

  // Increment total_imported_records
  if (imported_count > 0) {
    await supabase.rpc('increment_source_records', {
      p_source_id: source.id,
      p_count: imported_count,
    }).then(() => {}).catch(() => {
      // If RPC doesn't exist yet, skip — not critical
    });
  }

  await updateLog({
    status: finalStatus,
    completed_at: new Date().toISOString(),
    discovered_count: adapterResult.discovered_count,
    imported_count,
    duplicates_count,
    errors_count,
    error_details: errorDetails.length > 0 ? errorDetails : null,
  });

  return {
    source_id: source.id,
    source_name: source.name,
    discovered_count: adapterResult.discovered_count,
    imported_count,
    duplicates_count,
    errors_count,
    error_details: errorDetails.length > 0 ? errorDetails : undefined,
    status: finalStatus,
  };
}
