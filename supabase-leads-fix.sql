-- ==============================================================================
-- ReviewAssist — Fix Leads Table & RLS Policies for Supabase
-- ==============================================================================
-- Run this in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/sojryvohzlagalywpopf
-- 2. Click "SQL Editor" on the left menu
-- 3. Click "New Query", paste this entire script, and click "Run"
-- ==============================================================================

-- 1. Create Leads Table if not exists
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

-- 2. Index for sorting
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. Drop any old restrictive policies
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow select on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow update on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow delete on leads" ON public.leads;

-- 5. Create Permissive Policies for Visitor Submissions and Admin Panel Management
CREATE POLICY "Anyone can submit a lead"
    ON public.leads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow select on leads"
    ON public.leads FOR SELECT
    USING (true);

CREATE POLICY "Allow update on leads"
    ON public.leads FOR UPDATE
    USING (true);

CREATE POLICY "Allow delete on leads"
    ON public.leads FOR DELETE
    USING (true);

-- 6. Enable Realtime on leads table
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
