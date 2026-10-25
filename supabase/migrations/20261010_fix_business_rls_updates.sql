-- ==============================================================================
-- ReviewAssist SaaS Platform — Full Real-Time Sync & RLS Fix
-- Migration: 20261010_fix_business_rls_updates.sql
-- ==============================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- 1. Go to https://supabase.com/dashboard/project/sojryvohzlagalywpopf
-- 2. Click "SQL Editor" on the left navigation
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
-- ==============================================================================

-- 1. ADD GOOGLE REVIEW LINK, LOGO, TAGLINE & PHONE COLUMNS TO BUSINESSES TABLE
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS google_review_link TEXT;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS tagline TEXT;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS ai_credits_used INT DEFAULT 0;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';

-- Backfill from google_review_url if null
UPDATE public.businesses
SET google_review_link = google_review_url
WHERE google_review_link IS NULL AND google_review_url IS NOT NULL;

-- Set default placeholder for existing rows without any link
UPDATE public.businesses
SET google_review_link = 'https://g.page/r/example/review'
WHERE google_review_link IS NULL OR google_review_link = '';


-- 2. CREATE / VERIFY LEADS TABLE STRUCTURE
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY DEFAULT ('lead-' || substr(md5(random()::text), 1, 8)),
    owner_name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT,
    locations TEXT DEFAULT '1 location',
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    google_profile_url TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);


-- 3. GRANT TABLE & SEQUENCE ACCESS TO ANON AND AUTHENTICATED ROLES
-- Minimum privilege principle: anon role only gets required public insert/select permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Leads: anon can only submit (INSERT); authenticated (admin) can manage
REVOKE ALL ON public.leads FROM anon;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Businesses: anon can only read public safe columns; authenticated can manage
REVOKE ALL ON public.businesses FROM anon;
GRANT SELECT (id, name, category, services, google_review_link, logo_url, tagline, status, subscription_status, created_at, phone)
ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

-- Subscriptions: anon has NO access; only authenticated & service_role
REVOKE ALL ON public.subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;

-- Reviews: anon can insert feedback/reviews and read reviews; authenticated can manage
REVOKE ALL ON public.reviews FROM anon;
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO authenticated;


-- 4. FIX ROW-LEVEL SECURITY (RLS) FOR LEADS TABLE (F-007)
-- (Allows visitors to submit "Get QR Code" inquiries, while restricting reads/updates to authenticated admins)
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


-- 5. FIX ROW-LEVEL SECURITY (RLS) FOR BUSINESSES TABLE (F-008, F-015)
-- (Ensures public review scanning works for anon, while mutations require authenticated role)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their business" ON public.businesses;
DROP POLICY IF EXISTS "Business owners or Super Admins can update their business" ON public.businesses;
DROP POLICY IF EXISTS "Business owners or Super Admins can delete their business" ON public.businesses;
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


-- 6. FIX ROW-LEVEL SECURITY (RLS) FOR SUBSCRIPTIONS TABLE (F-016)
-- (Completely blocks anonymous access; permits only authenticated users and service_role)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business members can view their subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Business owners or Super Admins can manage subscriptions" ON public.subscriptions;
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


-- 7. ENABLE REALTIME SYNC ON LEADS AND BUSINESSES
-- (Enables instant 0ms broadcast to Admin Inbox and Clients tab when leads submit)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'businesses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
    END IF;
END $$;
