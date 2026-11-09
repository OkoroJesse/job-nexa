import { PublicOpportunity, UnlockedOpportunity, Category, LocationState } from '@/types/database';
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
 * Queries the real Supabase database and returns public-safe masked data.
 */
export async function getOpportunities(filters: OpportunityFilterParams = {}): Promise<PublicOpportunity[]> {
  try {
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
      query = query.or(`title.ilike.%${filters.query}%,organization_name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
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
    if (error) {
      console.warn('Opportunities fetch query error:', error.message);
      return [];
    }

    return (data || []) as unknown as PublicOpportunity[];
  } catch (err) {
    console.warn('Opportunities service error:', err);
    return [];
  }
}

/**
 * Fetch a single opportunity by slug from the database.
 */
export async function getOpportunityBySlug(
  slug: string,
  userSubscriptionActive: boolean = false
): Promise<{ opportunity: PublicOpportunity | UnlockedOpportunity | null; isUnlocked: boolean }> {
  try {
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
      .maybeSingle();

    if (!error && data) {
      const opp = data as unknown as UnlockedOpportunity;
      if (!opp.is_locked || userSubscriptionActive) {
        return { opportunity: opp, isUnlocked: true };
      } else {
        return { opportunity: maskOpportunityForPublic(opp), isUnlocked: false };
      }
    }

    return { opportunity: null, isUnlocked: false };
  } catch (err) {
    console.warn('Opportunity slug lookup error:', err);
    return { opportunity: null, isUnlocked: false };
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      return data as Category[];
    }
  } catch (err) {
    console.warn('Categories fetch error:', err);
  }
  return [];
}

export async function getStates(): Promise<LocationState[]> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from('locations_states')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      return data as LocationState[];
    }
  } catch (err) {
    console.warn('States fetch error:', err);
  }
  return [];
}
