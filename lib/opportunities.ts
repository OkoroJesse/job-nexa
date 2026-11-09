import { PublicOpportunity, UnlockedOpportunity, Category, LocationState } from '@/types/database';
import { SEED_OPPORTUNITIES, SEED_CATEGORIES, SEED_STATES } from './mock-data';
import { createPublicServerClient } from './supabase/server';

export interface OpportunityFilterParams {
  query?: string;
  categoryId?: string;
  categorySlug?: string;
  stateId?: string;
  stateSlug?: string;
  opportunityType?: string;
  workplacePolicy?: string;
  isFeatured?: boolean;
}

/**
 * Strips private contact info and application instructions from an opportunity
 * to ensure that non-members NEVER receive private data across the network wire.
 */
export function maskOpportunityForPublic(opp: UnlockedOpportunity): PublicOpportunity {
  if (!opp.is_locked) {
    return opp;
  }

  const {
    employer_email,
    employer_phone,
    application_url,
    application_instructions,
    ...publicData
  } = opp;

  return publicData;
}

/**
 * Retrieve a list of opportunities with optional filtering.
 * Returns public-safe masked data.
 */
export async function getOpportunities(filters: OpportunityFilterParams = {}): Promise<PublicOpportunity[]> {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const supabase = createPublicServerClient();
      let query = supabase
        .from('opportunities')
        .select(`
          id, title, slug, organization_name, organization_logo_url,
          category_id, state_id, city, workplace_policy, opportunity_type,
          experience_level, salary_or_stipend_range, description, requirements,
          benefits, application_deadline, is_locked, is_featured, views_count,
          published_at, created_at,
          category:categories(id, name, slug, icon_name),
          state:locations_states(id, name, slug, geopolitical_zone)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (filters.query) {
        query = query.ilike('title', `%${filters.query}%`);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.stateId) {
        query = query.eq('state_id', filters.stateId);
      }
      if (filters.opportunityType) {
        query = query.eq('opportunity_type', filters.opportunityType);
      }
      if (filters.workplacePolicy) {
        query = query.eq('workplace_policy', filters.workplacePolicy);
      }
      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as unknown as PublicOpportunity[];
      }
    }
  } catch (err) {
    console.warn('Falling back to local data store:', err);
  }

  // Fallback to high-fidelity seed dataset
  let results = [...SEED_OPPORTUNITIES];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.organization_name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
    );
  }

  if (filters.categorySlug) {
    results = results.filter((o) => o.category?.slug === filters.categorySlug);
  } else if (filters.categoryId) {
    results = results.filter((o) => o.category_id === filters.categoryId);
  }

  if (filters.stateSlug) {
    results = results.filter((o) => o.state?.slug === filters.stateSlug);
  } else if (filters.stateId) {
    results = results.filter((o) => o.state_id === filters.stateId);
  }

  if (filters.opportunityType) {
    results = results.filter((o) => o.opportunity_type === filters.opportunityType);
  }

  if (filters.workplacePolicy) {
    results = results.filter((o) => o.workplace_policy === filters.workplacePolicy);
  }

  if (filters.isFeatured !== undefined) {
    results = results.filter((o) => o.is_featured === filters.isFeatured);
  }

  return results.map(maskOpportunityForPublic);
}

/**
 * Fetch a single opportunity by slug.
 */
export async function getOpportunityBySlug(
  slug: string,
  userSubscriptionActive: boolean = false
): Promise<{ opportunity: PublicOpportunity | UnlockedOpportunity | null; isUnlocked: boolean }> {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const supabase = createPublicServerClient();
      
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          category:categories(id, name, slug, icon_name),
          state:locations_states(id, name, slug, geopolitical_zone)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        const opp = data as unknown as UnlockedOpportunity;
        if (!opp.is_locked || userSubscriptionActive) {
          return { opportunity: opp, isUnlocked: true };
        } else {
          return { opportunity: maskOpportunityForPublic(opp), isUnlocked: false };
        }
      }
    }
  } catch (err) {
    console.warn('Falling back to local data store for slug lookup:', err);
  }

  const raw = SEED_OPPORTUNITIES.find((o) => o.slug === slug);
  if (!raw) return { opportunity: null, isUnlocked: false };

  if (!raw.is_locked || userSubscriptionActive) {
    return { opportunity: raw, isUnlocked: true };
  }

  return { opportunity: maskOpportunityForPublic(raw), isUnlocked: false };
}

export async function getCategories(): Promise<Category[]> {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const supabase = createPublicServerClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    }
  } catch {
    // fallback
  }
  return SEED_CATEGORIES;
}

export async function getStates(): Promise<LocationState[]> {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const supabase = createPublicServerClient();
      const { data, error } = await supabase
        .from('locations_states')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as LocationState[];
      }
    }
  } catch {
    // fallback
  }
  return SEED_STATES;
}
