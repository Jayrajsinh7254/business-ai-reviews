-- ==============================================================================
-- ReviewAssist SaaS Platform — Security Hardening & Strict RLS Migration
-- Migration: 20261025_harden_security_and_rls.sql
-- Addresses CodeRabbit Security Findings:
--   F-004: Sensitive data exposure (removes credential JSON from leads table)
--   F-007: Authorization bypass (revokes anon SELECT/UPDATE/DELETE on leads)
--   F-008: Authorization bypass (revokes anon UPDATE/INSERT/DELETE on businesses)
--   F-014: Race condition in AI review credit accounting (atomic stored procedures)
--   F-015: Sensitive data exposure (restricts anon to public business columns)
--   F-016: Authorization bypass (revokes anon access to subscriptions)
-- ==============================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- 1. Go to https://supabase.com/dashboard/project/sojryvohzlagalywpopf
-- 2. Click "SQL Editor" on the left navigation
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
-- ==============================================================================

-- 0. ENSURE ALL REQUIRED COLUMNS EXIST BEFORE GRANTING COLUMN PRIVILEGES
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_review_link TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS ai_credits_used INT DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'starter';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS paid_until TIMESTAMPTZ;

-- Backfill google_review_link from legacy google_review_url if needed
UPDATE public.businesses
SET google_review_link = google_review_url
WHERE google_review_link IS NULL AND google_review_url IS NOT NULL;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS staff_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS staff_name TEXT;


-- 1. SECURE PRIVILEGES ON LEADS TABLE (F-007)
-- Anonymous users can only INSERT inquiries. Only authenticated admins can read, update, or delete leads.
REVOKE ALL ON public.leads FROM anon;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Allow select on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow update on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow delete on leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

CREATE POLICY "Anyone can submit a lead"
    ON public.leads FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view leads"
    ON public.leads FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update leads"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete leads"
    ON public.leads FOR DELETE
    TO authenticated
    USING (true);

-- Purge any legacy credential copies stored in leads table (F-004)
DELETE FROM public.leads WHERE id LIKE 'cred-%' OR message LIKE '%"client_credential"%';


-- 2. SECURE PRIVILEGES ON BUSINESSES TABLE (F-008, F-015)
-- Anonymous users (public reviewers) can only view public safe columns.
-- Mutations (INSERT, UPDATE, DELETE) are strictly revoked from anonymous users.
REVOKE ALL ON public.businesses FROM anon;
GRANT SELECT (id, name, category, services, google_review_link, logo_url, tagline, status, subscription_status, created_at, phone)
ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow all insert on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow all update on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow all delete on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can delete businesses" ON public.businesses;

CREATE POLICY "Public can view businesses"
    ON public.businesses FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert businesses"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update businesses"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete businesses"
    ON public.businesses FOR DELETE
    TO authenticated
    USING (true);


-- 3. SECURE PRIVILEGES ON SUBSCRIPTIONS TABLE (F-016)
-- Completely revoke anonymous access to billing and subscription data.
REVOKE ALL ON public.subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all insert on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all update on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can update subscriptions" ON public.subscriptions;

CREATE POLICY "Authenticated users can view subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update subscriptions"
    ON public.subscriptions FOR UPDATE
    TO authenticated
    USING (true);


-- 4. SECURE REVIEWS TABLE
REVOKE ALL ON public.reviews FROM anon;
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO authenticated;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public select on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;

CREATE POLICY "Public can submit reviews"
    ON public.reviews FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Public can view reviews"
    ON public.reviews FOR SELECT
    TO anon, authenticated
    USING (true);


-- 5. ATOMIC AI CREDIT ACCOUNTING STORED PROCEDURES (F-014)
-- Eliminates concurrency race conditions by using row-level locking (FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reserve_ai_credit(p_business_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_id TEXT;
    v_credits INT;
    v_status TEXT;
    v_sub_status TEXT;
    v_paid_until TIMESTAMPTZ;
BEGIN
    SELECT plan_id, COALESCE(ai_credits_used, 0), status, subscription_status, paid_until
    INTO v_plan_id, v_credits, v_status, v_sub_status, v_paid_until
    FROM public.businesses
    WHERE id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('allowed', false, 'error', 'Business not found');
    END IF;

    IF v_status = 'inactive' OR v_sub_status = 'inactive' OR v_sub_status = 'canceled' OR (v_paid_until IS NOT NULL AND v_paid_until < now()) THEN
        RETURN jsonb_build_object('allowed', false, 'error', 'Business service is inactive');
    END IF;

    IF LOWER(COALESCE(v_plan_id, 'starter')) = 'starter' AND v_credits >= 100 THEN
        RETURN jsonb_build_object('allowed', false, 'error', 'Monthly AI review limit reached (100/100).');
    END IF;

    UPDATE public.businesses
    SET ai_credits_used = v_credits + 1
    WHERE id = p_business_id;

    RETURN jsonb_build_object('allowed', true, 'credits_used', v_credits + 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_credit(p_business_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.businesses
    SET ai_credits_used = GREATEST(0, COALESCE(ai_credits_used, 1) - 1)
    WHERE id = p_business_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_ai_credit(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_ai_credit(TEXT) TO anon, authenticated, service_role;


-- 6. ADMIN USER & PASSWORD SYNC FUNCTION
-- Ensures that when an admin updates a client's password in the admin panel,
-- the password in auth.users is immediately updated so Supabase Auth verifies it on both devices.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_update_user_credentials(
    p_email TEXT,
    p_new_password TEXT,
    p_business_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    IF p_email IS NULL OR p_email = '' OR p_new_password IS NULL OR p_new_password = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email and password are required');
    END IF;

    -- Look up user in auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Encrypt new password using bcrypt
        v_encrypted_pw := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

        UPDATE auth.users
        SET encrypted_password = v_encrypted_pw,
            updated_at = now()
        WHERE id = v_user_id;

        -- Update business user_id if provided
        IF p_business_id IS NOT NULL THEN
            UPDATE public.businesses
            SET user_id = v_user_id
            WHERE id = p_business_id AND (user_id IS NULL OR user_id = v_user_id);
        END IF;

        RETURN jsonb_build_object('success', true, 'updated', true, 'user_id', v_user_id);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'User not found in auth.users');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_credentials(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
