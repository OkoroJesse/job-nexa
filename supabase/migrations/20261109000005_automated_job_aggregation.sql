-- ==============================================================================
-- JOBNEXA MIGRATION: 20261109000005_automated_job_aggregation.sql
-- Description: Automated Job Aggregation, Source Management, Deduplication & Freshness
-- ==============================================================================

-- 1. EXTEND authorized_sources TABLE
ALTER TABLE public.authorized_sources 
ADD COLUMN IF NOT EXISTS import_frequency_minutes INT NOT NULL DEFAULT 1440,
ADD COLUMN IF NOT EXISTS next_scheduled_poll_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_attribution TEXT,
ADD COLUMN IF NOT EXISTS rate_limit_rpm INT NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS last_error_message TEXT,
ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS attribution_required BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS commercial_republication_status TEXT NOT NULL DEFAULT 'permitted';

-- 2. EXTEND opportunities TABLE WITH SOURCE TRACKING & DEDUPLICATION
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.authorized_sources(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS source_identifier TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS dedup_hash TEXT,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS raw_source_data JSONB;

-- Create performance indexes for deduplication and query filtering
CREATE INDEX IF NOT EXISTS idx_opportunities_dedup_hash ON public.opportunities(dedup_hash);
CREATE INDEX IF NOT EXISTS idx_opportunities_source_tracking ON public.opportunities(source_id, source_identifier);
CREATE INDEX IF NOT EXISTS idx_opportunities_status_deadline ON public.opportunities(status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_verification ON public.opportunities(verification_status, last_verified_at);

-- 3. CREATE import_execution_logs TABLE
CREATE TABLE IF NOT EXISTS public.import_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.authorized_sources(id) ON DELETE CASCADE,
    source_name TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed', 'partial'
    discovered_count INT NOT NULL DEFAULT 0,
    imported_count INT NOT NULL DEFAULT 0,
    duplicates_count INT NOT NULL DEFAULT 0,
    errors_count INT NOT NULL DEFAULT 0,
    error_details JSONB,
    triggered_by TEXT NOT NULL DEFAULT 'scheduler', -- 'scheduler', 'manual_admin'
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_logs_source ON public.import_execution_logs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON public.import_execution_logs(status, started_at DESC);

-- Enable RLS on import_execution_logs
ALTER TABLE public.import_execution_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read and manage import execution logs
DROP POLICY IF EXISTS "Admins manage import execution logs" ON public.import_execution_logs;
CREATE POLICY "Admins manage import execution logs" ON public.import_execution_logs
    FOR ALL USING (public.is_admin());

-- 4. SEED INITIAL AUTHORISED OPPORTUNITY SOURCES
-- Sources with verified public APIs / feeds and commercial transparency
INSERT INTO public.authorized_sources (
    id,
    name,
    source_type,
    endpoint_url,
    import_frequency_minutes,
    default_attribution,
    attribution_required,
    commercial_republication_status,
    is_active,
    config
) VALUES 
(
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Flutterwave Careers (Official Greenhouse API)',
    'greenhouse',
    'https://boards-api.greenhouse.io/v1/boards/flutterwave/jobs?content=true',
    720,
    'Flutterwave Careers via Official ATS Feed',
    TRUE,
    'permitted',
    TRUE,
    '{"board_token": "flutterwave", "country_filter": ["Nigeria", "Lagos", "Remote", "Africa"]}'::jsonb
),
(
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'Paystack Careers (Official Lever API)',
    'lever',
    'https://api.lever.co/v0/postings/paystack?mode=json',
    720,
    'Paystack Careers via Official ATS Feed',
    TRUE,
    'permitted',
    TRUE,
    '{"site_name": "paystack", "country_filter": ["Nigeria", "Lagos", "Remote"]}'::jsonb
),
(
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'Andela Careers (Official Greenhouse API)',
    'greenhouse',
    'https://boards-api.greenhouse.io/v1/boards/andela/jobs?content=true',
    1440,
    'Andela Careers via Official ATS Feed',
    TRUE,
    'permitted',
    TRUE,
    '{"board_token": "andela", "country_filter": ["Nigeria", "Lagos", "Remote", "Worldwide"]}'::jsonb
),
(
    'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    'Jooble Partner Search API (Nigeria Opportunities)',
    'jooble',
    'https://jooble.org/api/',
    360,
    'Jooble Job Search Engine (Nigeria)',
    TRUE,
    'partner_agreement',
    FALSE, -- Inactive by default until JOOBLE_API_KEY is configured in admin settings
    '{"location": "Nigeria", "keywords": "Graduate Trainee OR NYSC OR Remote OR Manager", "env_secret_key": "JOOBLE_API_KEY"}'::jsonb
)
ON CONFLICT (endpoint_url) DO UPDATE SET
    import_frequency_minutes = EXCLUDED.import_frequency_minutes,
    default_attribution = EXCLUDED.default_attribution,
    attribution_required = EXCLUDED.attribution_required,
    commercial_republication_status = EXCLUDED.commercial_republication_status,
    config = EXCLUDED.config;
