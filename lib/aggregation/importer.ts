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

const NIGERIAN_STATE_KEYWORDS: Record<string, string[]> = {
  'Federal Capital Territory (Abuja)': ['abuja', 'fct', 'federal capital'],
  'Lagos': ['lagos', 'ikeja', 'lekki', 'victoria island', 'yaba'],
  'Rivers': ['rivers', 'port harcourt'],
  'Oyo': ['oyo', 'ibadan'],
  'Ogun': ['ogun', 'abeokuta', 'ota'],
  'Kano': ['kano'],
  'Kaduna': ['kaduna'],
  'Anambra': ['anambra', 'awka', 'onitsha'],
  'Enugu': ['enugu', 'nsukka'],
  'Delta': ['delta', 'warri', 'asaba'],
  'Edo': ['edo', 'benin city', 'benin'],
  'Akwa Ibom': ['akwa ibom', 'uyo'],
  'Cross River': ['cross river', 'calabar'],
  'Imo': ['imo', 'owerri'],
  'Abia': ['abia', 'umuahia', 'aba'],
  'Plateau': ['plateau', 'jos'],
  'Kwara': ['kwara', 'ilorin'],
  'Benue': ['benue', 'makurdi'],
  'Ondo': ['ondo', 'akure'],
  'Osun': ['osun', 'osogbo'],
  'Ekiti': ['ekiti', 'ado-ekiti', 'ado ekiti'],
  'Bauchi': ['bauchi'],
  'Gombe': ['gombe'],
  'Taraba': ['taraba', 'jalingo'],
  'Katsina': ['katsina'],
  'Bayelsa': ['bayelsa', 'yenagoa'],
  'Borno': ['borno', 'maiduguri'],
  'Adamawa': ['adamawa', 'yola'],
  'Niger': ['niger', 'minna'],
  'Nasarawa': ['nasarawa', 'lafia'],
  'Kogi': ['kogi', 'lokoja'],
  'Sokoto': ['sokoto'],
  'Kebbi': ['kebbi', 'birnin kebbi'],
  'Zamfara': ['zamfara', 'gusau'],
  'Jigawa': ['jigawa', 'dutse'],
  'Yobe': ['yobe', 'damaturu'],
  'Ebonyi': ['ebonyi', 'abakaliki'],
};

let cachedStatesMap: Map<string, string> | null = null;
let cachedCategoriesList: Array<{ id: string; name: string; slug: string }> | null = null;

async function getCachedStates(supabase: any): Promise<Map<string, string>> {
  if (cachedStatesMap) return cachedStatesMap;
  const { data } = await supabase.from('locations_states').select('id, name');
  cachedStatesMap = new Map();
  if (data) {
    for (const s of data) {
      cachedStatesMap.set(s.name, s.id);
    }
  }
  return cachedStatesMap;
}

async function getCachedCategories(supabase: any): Promise<Array<{ id: string; name: string; slug: string }>> {
  if (cachedCategoriesList) return cachedCategoriesList;
  const { data } = await supabase.from('categories').select('id, name, slug');
  cachedCategoriesList = (data as Array<{ id: string; name: string; slug: string }>) || [];
  return cachedCategoriesList;
}

/** Resolve state_id intelligently from title, city, and state_name */
async function resolveStateId(
  supabase: any,
  job: NormalizedJob,
): Promise<{ stateId: string | null; workplacePolicy: string }> {
  const statesMap = await getCachedStates(supabase);
  const locationHaystack = `${job.title} ${job.city || ''} ${job.state_name || ''}`.toLowerCase();

  for (const [stateName, keywords] of Object.entries(NIGERIAN_STATE_KEYWORDS)) {
    if (keywords.some((kw) => locationHaystack.includes(kw))) {
      const stateId = statesMap.get(stateName) ?? null;
      const isRemote = locationHaystack.includes('remote') || locationHaystack.includes('home based');
      return {
        stateId,
        workplacePolicy: isRemote ? 'remote_nigeria' : 'on_site',
      };
    }
  }

  // Not tied to a specific state: check remote status
  const isGlobalRemote =
    locationHaystack.includes('emea') ||
    locationHaystack.includes('worldwide') ||
    locationHaystack.includes('global') ||
    locationHaystack.includes('remote') ||
    locationHaystack.includes('home based');

  if (isGlobalRemote) {
    const isExplicitlyNigeria = locationHaystack.includes('nigeria') || locationHaystack.includes('lagos');
    return {
      stateId: null,
      workplacePolicy: isExplicitlyNigeria ? 'remote_nigeria' : 'remote_global',
    };
  }

  return { stateId: null, workplacePolicy: 'on_site' };
}

/** Resolve category dynamically based on keywords */
async function resolveJobCategory(
  supabase: any,
  job: NormalizedJob,
  fallbackCategoryId: string | null,
): Promise<string | null> {
  const categories = await getCachedCategories(supabase);
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const text = `${job.title} ${job.description || ''} ${job.opportunity_type}`.toLowerCase();

  if (job.opportunity_type === 'scholarship' || text.includes('scholarship') || text.includes('fellowship') || text.includes('fellows program')) {
    if (catBySlug.has('scholarships-fellowships')) return catBySlug.get('scholarships-fellowships')!;
  }
  if (job.opportunity_type === 'grant' || text.includes('grant') || text.includes('funding') || text.includes('hackathon') || text.includes('prize') || text.includes('award')) {
    if (catBySlug.has('grants-sme-funding')) return catBySlug.get('grants-sme-funding')!;
  }
  if (job.opportunity_type === 'graduate_trainee' || text.includes('graduate trainee') || text.includes('grad trainee') || text.includes('trainee')) {
    if (catBySlug.has('graduate-trainee')) return catBySlug.get('graduate-trainee')!;
  }
  if (job.opportunity_type === 'nysc_ppa' || text.includes('nysc') || text.includes('corps member')) {
    if (catBySlug.has('nysc-ppa')) return catBySlug.get('nysc-ppa')!;
  }
  if (text.includes('software') || text.includes('developer') || text.includes('engineer') || text.includes('data') || text.includes('linux') || text.includes('cloud') || text.includes('devops') || text.includes('frontend') || text.includes('backend') || text.includes('qa ') || text.includes('python') || text.includes('golang') || text.includes('product manager')) {
    if (catBySlug.has('tech-software-data')) return catBySlug.get('tech-software-data')!;
  }
  if (text.includes('bank') || text.includes('finance') || text.includes('accountant') || text.includes('credit') || text.includes('risk') || text.includes('relationship manager') || text.includes('collections') || text.includes('sales') || text.includes('business development') || text.includes('audit')) {
    if (catBySlug.has('corporate-banking')) return catBySlug.get('corporate-banking')!;
  }
  if (text.includes('health') || text.includes('medical') || text.includes('nurse') || text.includes('doctor') || text.includes('clinical') || text.includes('pharma')) {
    if (catBySlug.has('healthcare')) return catBySlug.get('healthcare')!;
  }
  if (text.includes('ngo') || text.includes('humanitarian') || text.includes('foundation') || text.includes('non-profit') || text.includes('wikimedia') || text.includes('development')) {
    if (catBySlug.has('ngo-development')) return catBySlug.get('ngo-development')!;
  }
  if (text.includes('remote') || text.includes('home based') || text.includes('worldwide')) {
    if (catBySlug.has('remote-jobs')) return catBySlug.get('remote-jobs')!;
  }

  return fallbackCategoryId ?? catBySlug.get('tech-software-data') ?? categories[0]?.id ?? null;
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
  defaultCategoryId: string | null,
  autoPublish: boolean,
): Promise<Record<string, unknown>> {
  const { stateId, workplacePolicy } = await resolveStateId(supabase, job);
  const categoryId = await resolveJobCategory(supabase, job, defaultCategoryId);
  const hash = computeDedupHash(job.title, job.organization_name, job.application_url);

  // Slug: title-org-randomhex
  const slugBase = `${job.title}-${job.organization_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const slug = `${slugBase}-${hash.slice(0, 6)}`;

  const opportunityType = job.opportunity_type as string;

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
  const defaultCategoryId = source.default_category_id ?? null;

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

      const row = await normalizedJobToRow(supabase, job, source.id, defaultCategoryId, source.auto_publish);
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
