-- ====================================================================
-- JOBNEXA MIGRATION 20261109000004_initial_reference_seed_data.sql
-- Comprehensive Reference Data & Seed Records
-- Executable in Supabase SQL Editor
-- ====================================================================

-- 1. SEED 36 NIGERIAN STATES + FEDERAL CAPITAL TERRITORY (FCT)
INSERT INTO public.locations_states (name, slug, geopolitical_zone, sort_order, is_active) VALUES
('Abia', 'abia', 'South East', 1, true),
('Adamawa', 'adamawa', 'North East', 2, true),
('Akwa Ibom', 'akwa-ibom', 'South South', 3, true),
('Anambra', 'anambra', 'South East', 4, true),
('Bauchi', 'bauchi', 'North East', 5, true),
('Bayelsa', 'bayelsa', 'South South', 6, true),
('Benue', 'benue', 'North Central', 7, true),
('Borno', 'borno', 'North East', 8, true),
('Cross River', 'cross-river', 'South South', 9, true),
('Delta', 'delta', 'South South', 10, true),
('Ebonyi', 'ebonyi', 'South East', 11, true),
('Edo', 'edo', 'South South', 12, true),
('Ekiti', 'ekiti', 'South West', 13, true),
('Enugu', 'enugu', 'South East', 14, true),
('Federal Capital Territory (Abuja)', 'fct-abuja', 'North Central', 15, true),
('Gombe', 'gombe', 'North East', 16, true),
('Imo', 'imo', 'South East', 17, true),
('Jigawa', 'jigawa', 'North West', 18, true),
('Kaduna', 'kaduna', 'North West', 19, true),
('Kano', 'kano', 'North West', 20, true),
('Katsina', 'katsina', 'North West', 21, true),
('Kebbi', 'kebbi', 'North West', 22, true),
('Kogi', 'kogi', 'North Central', 23, true),
('Kwara', 'kwara', 'North Central', 24, true),
('Lagos', 'lagos', 'South West', 25, true),
('Nasarawa', 'nasarawa', 'North Central', 26, true),
('Niger', 'niger', 'North Central', 27, true),
('Ogun', 'ogun', 'South West', 28, true),
('Ondo', 'ondo', 'South West', 29, true),
('Osun', 'osun', 'South West', 30, true),
('Oyo', 'oyo', 'South West', 31, true),
('Plateau', 'plateau', 'North Central', 32, true),
('Rivers', 'rivers', 'South South', 33, true),
('Sokoto', 'sokoto', 'North West', 34, true),
('Taraba', 'taraba', 'North East', 35, true),
('Yobe', 'yobe', 'North East', 36, true),
('Zamfara', 'zamfara', 'North West', 37, true)
ON CONFLICT (slug) DO UPDATE SET
    geopolitical_zone = EXCLUDED.geopolitical_zone,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- 2. SEED OPPORTUNITY & JOB CATEGORIES
INSERT INTO public.categories (name, slug, description, icon_name, is_featured, sort_order) VALUES
('Corporate & Banking', 'corporate-banking', 'Commercial banks, investment houses, insurance and institutional finance.', 'Briefcase', true, 1),
('Tech, Software & Data', 'tech-software-data', 'Software engineering, UI/UX, product management, DevOps and AI.', 'Code', true, 2),
('NYSC & PPA Openings', 'nysc-ppa', 'Place of Primary Assignment openings with stipends above statutory allowee.', 'GraduationCap', true, 3),
('Graduate Trainee Programmes', 'graduate-trainee', 'Tier-1 corporate management trainee cycles for recent degree holders.', 'TrendingUp', true, 4),
('Remote Jobs (USD / EUR / NGN)', 'remote-jobs', 'Verified remote positions open to Nigerian professionals globally.', 'Globe', true, 5),
('Scholarships & Fellowships', 'scholarships-fellowships', 'Fully and partially funded undergraduate and postgraduate opportunities.', 'Award', true, 6),
('NGO & International Development', 'ngo-development', 'United Nations, foreign embassies, development agencies and non-profits.', 'HeartHandshake', false, 7),
('Healthcare & Pharmaceuticals', 'healthcare', 'Hospitals, diagnostics, pharmacists and healthcare management.', 'Activity', false, 8),
('Engineering, Oil & Gas', 'engineering-oil-gas', 'Upstream, downstream, mechanical, civil, electrical and renewable energy.', 'HardHat', false, 9),
('Grants & SME Funding', 'grants-sme-funding', 'Non-dilutive seed capital, enterprise grants and agricultural funding.', 'Coins', true, 10)
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order;

-- 3. SEED PLATFORM SETTINGS
-- NOTE: Invariant enforced — NO hardcoded bank account details are seeded.
-- The platform owner configures receiving bank accounts via the admin UI.
INSERT INTO public.platform_settings (key, value, description) VALUES
(
    'subscription_pricing',
    '{"amount_naira": 3500, "amount_kobo": 350000, "duration_days": 30}',
    'Current active subscription pricing for 30-day all-access membership.'
),
(
    'site_name',
    '"JobNexa"',
    'Platform brand name rendered across notifications and communications.'
),
(
    'maintenance_mode',
    'false',
    'System-wide maintenance toggle.'
),
(
    'paystack_enabled',
    'true',
    'Global Paystack card and USSD payment availability toggle.'
)
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description;

-- 4. INITIALISE BANK ACCOUNT CONFIG (DISABLED BY DEFAULT)
-- Owner must configure through Admin Dashboard -> Settings -> Payment Settings -> Bank Transfer
INSERT INTO public.bank_account_config (
    bank_name,
    account_number,
    account_name,
    transfer_instructions,
    is_enabled
)
VALUES (
    NULL,
    NULL,
    NULL,
    'Transfer exactly ₦3,500. Upload your transaction receipt below. Membership will be activated as soon as credit is confirmed on our bank ledger.',
    FALSE
)
ON CONFLICT DO NOTHING;

-- 5. SEED INITIAL AUTHORIZED SOURCES FOR JOB IMPORT CENTRE
INSERT INTO public.authorized_sources (name, source_type, endpoint_url, is_active, total_imported_records) VALUES
('Federal Civil Service Commission (Official Feeds)', 'rss', 'https://fcsc.gov.ng/feed/', false, 0),
('National Youth Service Corps (Official Portal Updates)', 'rss', 'https://www.nysc.gov.ng/feed', false, 0)
ON CONFLICT (endpoint_url) DO NOTHING;
