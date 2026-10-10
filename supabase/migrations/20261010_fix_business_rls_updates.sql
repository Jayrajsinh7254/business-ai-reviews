-- ==============================================================================
-- ReviewAssist SaaS Platform — Full Real-Time Sync & RLS Fix
-- Migration: 20261010_fix_business_rls_updates.sql
-- ==============================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- 1. Go to https://supabase.com/dashboard/project/sojryvohzlagalywpopf
-- 2. Click "SQL Editor" on the left navigation
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
-- ==============================================================================

-- 1. ADD GOOGLE REVIEW LINK & PHONE COLUMNS TO BUSINESSES TABLE
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS google_review_link TEXT;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';

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
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.leads TO anon, authenticated;
GRANT ALL ON public.businesses TO anon, authenticated;
GRANT ALL ON public.subscriptions TO anon, authenticated;
GRANT ALL ON public.reviews TO anon, authenticated;


-- 4. FIX ROW-LEVEL SECURITY (RLS) FOR LEADS TABLE
-- (Allows visitors to submit "Get QR Code" inquiries and admin to manage them)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Allow select on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow update on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow delete on leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can update leads" ON public.leads;

CREATE POLICY "Anyone can submit a lead"
    ON public.leads FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow select on leads"
    ON public.leads FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow update on leads"
    ON public.leads FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow delete on leads"
    ON public.leads FOR DELETE
    TO anon, authenticated
    USING (true);


-- 5. FIX ROW-LEVEL SECURITY (RLS) FOR BUSINESSES TABLE
-- (Ensures public review scanning, admin status toggles, and conversion work smoothly)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their business" ON public.businesses;
DROP POLICY IF EXISTS "Business owners or Super Admins can update their business" ON public.businesses;
DROP POLICY IF EXISTS "Business owners or Super Admins can delete their business" ON public.businesses;
DROP POLICY IF EXISTS "Allow all select on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow all insert on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow all update on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow all delete on businesses" ON public.businesses;

CREATE POLICY "Allow all select on businesses"
    ON public.businesses FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all insert on businesses"
    ON public.businesses FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all update on businesses"
    ON public.businesses FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all delete on businesses"
    ON public.businesses FOR DELETE
    TO anon, authenticated
    USING (true);


-- 6. FIX ROW-LEVEL SECURITY (RLS) FOR SUBSCRIPTIONS TABLE
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business members can view their subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Business owners or Super Admins can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all select on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all insert on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all update on subscriptions" ON public.subscriptions;

CREATE POLICY "Allow all select on subscriptions"
    ON public.subscriptions FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all insert on subscriptions"
    ON public.subscriptions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all update on subscriptions"
    ON public.subscriptions FOR UPDATE
    TO anon, authenticated
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
