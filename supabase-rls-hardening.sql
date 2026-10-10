-- ==============================================================================
-- ReviewAssist — Supabase Row Level Security (RLS) Hardening Script
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to secure all tables against
-- unauthorized access via the public anon key.
-- ==============================================================================

-- 1. Ensure RLS is active on ALL public tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_events ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing permissive policies to replace with hardened versions
DROP POLICY IF EXISTS "Admins or authenticated can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins or authenticated can update leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Super Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

DROP POLICY IF EXISTS "Payment events viewable by admin or owner" ON public.payment_events;
DROP POLICY IF EXISTS "Payment events insertable by service role or admin" ON public.payment_events;

-- 3. LEADS TABLE (Visitor Inquiry / Contact form)
-- Hardening: Anyone can INSERT their inquiry, but ONLY Super Admins can SELECT, UPDATE, or DELETE.
-- This prevents attackers from dumping customer emails and phone numbers.
CREATE POLICY "Anyone can submit a lead"
    ON public.leads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Super Admins can view leads"
    ON public.leads FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Super Admins can update leads"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Super Admins can delete leads"
    ON public.leads FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

-- 4. PAYMENT_EVENTS TABLE (Webhook & Transactions log)
-- Hardening: Only Super Admins and the specific Business Owner can read payment events.
CREATE POLICY "Super Admins or business owners can view relevant payment events"
    ON public.payment_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin') OR
        EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = payment_events.business_id AND businesses.user_id = auth.uid())
    );

CREATE POLICY "Service role or Super Admins can manage payment events"
    ON public.payment_events FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

-- 5. PROFILES TABLE
-- Ensure users can only read their own profile, Super Admins can read all.
DROP POLICY IF EXISTS "Users can view their own profile or Super Admins can view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or Super Admins can view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 6. BUSINESSES TABLE
-- Public can view businesses (needed so customers can review them at /review/:businessId).
-- Only owners and super admins can modify.
DROP POLICY IF EXISTS "Users can create their business" ON public.businesses;
CREATE POLICY "Authenticated users can create their business"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Confirmation notice
COMMENT ON TABLE public.leads IS 'Visitor contact submissions — protected by strict RLS';
COMMENT ON TABLE public.payment_events IS 'Payment audit log — protected by strict RLS';
