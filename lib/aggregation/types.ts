// ============================================================
// lib/aggregation/types.ts
// Shared types for the automated job aggregation system
// ============================================================

export interface NormalizedJob {
  title: string;
  organization_name: string;
  description: string;
  requirements: string;
  benefits?: string | null;
  salary_or_stipend_range?: string | null;
  opportunity_type: string;
  experience_level?: string | null;
  workplace_policy?: string | null;
  city?: string | null;
  state_name?: string | null;
  application_deadline?: string | null;
  application_url: string;
  source_identifier: string; // unique ID within this source
  source_url?: string | null; // canonical listing URL
  source_name: string;
  original_published_at?: string | null;
  eligibility_notes?: string | null;
  raw_source_data?: Record<string, unknown>;
}

export interface AdapterResult {
  jobs: NormalizedJob[];
  error?: string | null;
  discovered_count: number;
}

export interface SourceConfig {
  id: string;
  name: string;
  source_type: string;
  endpoint_url: string;
  config: Record<string, unknown>;
  default_attribution: string | null;
  rate_limit_rpm: number;
}

export interface ImportResult {
  source_id: string;
  source_name: string;
  discovered_count: number;
  imported_count: number;
  duplicates_count: number;
  errors_count: number;
  error_details?: unknown;
  status: 'success' | 'failed' | 'partial';
}
