-- ====================================================================
-- JOBNEXA SEED DATA (supabase/seed.sql)
-- 36 Nigerian States + FCT + Core Opportunity Taxonomies & Seed Listings
-- ====================================================================

-- 1. SEED ALL 36 STATES + FCT
INSERT INTO public.locations_states (name, slug, geopolitical_zone, sort_order) VALUES
('Abia', 'abia', 'South East', 1),
('Adamawa', 'adamawa', 'North East', 2),
('Akwa Ibom', 'akwa-ibom', 'South South', 3),
('Anambra', 'anambra', 'South East', 4),
('Bauchi', 'bauchi', 'North East', 5),
('Bayelsa', 'bayelsa', 'South South', 6),
('Benue', 'benue', 'North Central', 7),
('Borno', 'borno', 'North East', 8),
('Cross River', 'cross-river', 'South South', 9),
('Delta', 'delta', 'South South', 10),
('Ebonyi', 'ebonyi', 'South East', 11),
('Edo', 'edo', 'South South', 12),
('Ekiti', 'ekiti', 'South West', 13),
('Enugu', 'enugu', 'South East', 14),
('Federal Capital Territory (Abuja)', 'fct-abuja', 'North Central', 15),
('Gombe', 'gombe', 'North East', 16),
('Imo', 'imo', 'South East', 17),
('Jigawa', 'jigawa', 'North West', 18),
('Kaduna', 'kaduna', 'North West', 19),
('Kano', 'kano', 'North West', 20),
('Katsina', 'katsina', 'North West', 21),
('Kebbi', 'kebbi', 'North West', 22),
('Kogi', 'kogi', 'North Central', 23),
('Kwara', 'kwara', 'North Central', 24),
('Lagos', 'lagos', 'South West', 25),
('Nasarawa', 'nasarawa', 'North Central', 26),
('Niger', 'niger', 'North Central', 27),
('Ogun', 'ogun', 'South West', 28),
('Ondo', 'ondo', 'South West', 29),
('Osun', 'osun', 'South West', 30),
('Oyo', 'oyo', 'South West', 31),
('Plateau', 'plateau', 'North Central', 32),
('Rivers', 'rivers', 'South South', 33),
('Sokoto', 'sokoto', 'North West', 34),
('Taraba', 'taraba', 'North East', 35),
('Yobe', 'yobe', 'North East', 36),
('Zamfara', 'zamfara', 'North West', 37)
ON CONFLICT (slug) DO NOTHING;

-- 2. SEED CATEGORIES
INSERT INTO public.categories (name, slug, description, icon_name, is_featured, sort_order) VALUES
('Corporate & Banking', 'corporate-banking', 'Commercial banks, fintechs, FMCGs and institutional roles.', 'Briefcase', true, 1),
('Tech, Software & Data', 'tech-software-data', 'Engineering, product, design, data analysis and IT infrastructure.', 'Code', true, 2),
('NYSC & PPA Openings', 'nysc-ppa', 'Verified Primary Assignment postings paying above statutory federal allowee.', 'GraduationCap', true, 3),
('Graduate Trainee Programmes', 'graduate-trainee', 'Fast-track corporate leadership and management trainee cycles.', 'TrendingUp', true, 4),
('Remote Jobs (USD / EUR / NGN)', 'remote-jobs', 'Work from anywhere with verified global and Nigerian employers.', 'Globe', true, 5),
('Scholarships & Fellowships', 'scholarships-fellowships', 'Fully and partially funded undergraduate and postgraduate opportunities.', 'Award', true, 6),
('NGO & International Development', 'ngo-development', 'United Nations, USAID, international charities and development agencies.', 'HeartHandshake', false, 7),
('Healthcare & Pharmaceuticals', 'healthcare', 'Hospitals, medical labs, pharmacists and clinical research.', 'Activity', false, 8),
('Engineering, Oil & Gas', 'engineering-oil-gas', 'Upstream, midstream, construction and field engineering.', 'HardHat', false, 9),
('Grants & SME Funding', 'grants-sme-funding', 'Non-dilutive capital, founder grants, and agricultural intervention schemes.', 'Coins', true, 10)
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED PLATFORM SETTINGS
-- NOTE: Bank account details are NOT seeded here.
-- The platform owner must configure their own bank account through:
--   Admin Dashboard → Settings → Payment Settings → Bank Transfer
-- See: bank_account_config table (migration 000002)
INSERT INTO public.platform_settings (key, value, description) VALUES
(
    'subscription_pricing',
    '{"amount_naira": 3500, "amount_kobo": 350000, "duration_days": 30}',
    'Current active subscription pricing. Update with admin approval.'
),
(
    'site_name',
    '"JobNexa"',
    'Platform display name used in emails and metadata.'
),
(
    'maintenance_mode',
    'false',
    'When true, all public pages show a maintenance notice.'
),
(
    'paystack_enabled',
    'true',
    'Whether Paystack card payment is available to users.'
)
ON CONFLICT (key) DO NOTHING;

-- Initialize the empty bank account config (owner must configure via admin dashboard)
INSERT INTO public.bank_account_config (is_enabled)
VALUES (FALSE)
ON CONFLICT DO NOTHING;
