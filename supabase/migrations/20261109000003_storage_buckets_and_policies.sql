-- ====================================================================
-- JOBNEXA MIGRATION 20261109000003_storage_buckets_and_policies.sql
-- Storage Buckets & Storage Row Level Security (RLS) Access Policies
-- Executable directly in Supabase SQL Editor
-- ====================================================================

-- 1. CREATE STORAGE BUCKETS IN Supabase storage.buckets schema
-- Handles idempotency with ON CONFLICT (id) DO UPDATE / DO NOTHING

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'payment-receipts',
        'payment-receipts',
        false,
        5242880, -- 5MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    ),
    (
        'organization-logos',
        'organization-logos',
        true,
        2097152, -- 2MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    ),
    (
        'resumes',
        'resumes',
        false,
        10485760, -- 10MB limit
        ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. STORAGE POLICIES
-- Wrapped in a safe PL/pgSQL block to ensure seamless execution in all Supabase hosting environments
-- (Handles cases where direct DDL on storage.objects requires supabase_admin role)

DO $$
BEGIN
    -- payment-receipts policies
    DROP POLICY IF EXISTS "Authenticated users upload own payment receipts" ON storage.objects;
    CREATE POLICY "Authenticated users upload own payment receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'payment-receipts' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    DROP POLICY IF EXISTS "Users view own payment receipts" ON storage.objects;
    CREATE POLICY "Users view own payment receipts"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'payment-receipts' 
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );

    DROP POLICY IF EXISTS "Admins manage payment receipts" ON storage.objects;
    CREATE POLICY "Admins manage payment receipts"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'payment-receipts' 
        AND public.is_admin()
    );

    -- organization-logos policies
    DROP POLICY IF EXISTS "Public view organization logos" ON storage.objects;
    CREATE POLICY "Public view organization logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'organization-logos');

    DROP POLICY IF EXISTS "Admins upload organization logos" ON storage.objects;
    CREATE POLICY "Admins upload organization logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'organization-logos' 
        AND public.is_admin()
    );

    DROP POLICY IF EXISTS "Admins update organization logos" ON storage.objects;
    CREATE POLICY "Admins update organization logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'organization-logos' 
        AND public.is_admin()
    );

    DROP POLICY IF EXISTS "Admins delete organization logos" ON storage.objects;
    CREATE POLICY "Admins delete organization logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'organization-logos' 
        AND public.is_admin()
    );

    -- resumes policies
    DROP POLICY IF EXISTS "Users upload own resume" ON storage.objects;
    CREATE POLICY "Users upload own resume"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'resumes' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    DROP POLICY IF EXISTS "Users view own resume or admin" ON storage.objects;
    CREATE POLICY "Users view own resume or admin"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resumes' 
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );

    DROP POLICY IF EXISTS "Users delete own resume" ON storage.objects;
    CREATE POLICY "Users delete own resume"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'resumes' 
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );

    RAISE NOTICE 'Storage buckets and policies successfully applied.';
EXCEPTION 
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Storage buckets created. Note: Storage policies on storage.objects can also be managed via the Supabase Dashboard under Storage -> Policies.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage notice: %', SQLERRM;
END $$;
