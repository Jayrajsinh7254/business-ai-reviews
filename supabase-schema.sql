-- ==============================================================================
-- ReviewAssist SaaS Platform — Complete Database Schema, RBAC & Seed Data
-- ==============================================================================
-- Run this SQL in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running (optional, preserves clean state)
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Create Profiles Table (User RBAC Role Storage)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'business_owner' CHECK (role IN ('super_admin', 'business_owner', 'business_staff', 'customer')),
    business_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Businesses Table
CREATE TABLE public.businesses (
    id TEXT PRIMARY KEY DEFAULT ('biz-' || substr(md5(random()::text), 1, 8)),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    services TEXT[] NOT NULL DEFAULT '{}',
    google_review_url TEXT,
    email TEXT,
    plan_id TEXT NOT NULL DEFAULT 'pro' CHECK (plan_id IN ('starter', 'pro', 'enterprise')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
    ai_credits_used INTEGER NOT NULL DEFAULT 0,
    whatsapp_invites_used INTEGER NOT NULL DEFAULT 0,
    branding_color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Subscriptions Table
CREATE TABLE public.subscriptions (
    id TEXT PRIMARY KEY DEFAULT ('sub-' || substr(md5(random()::text), 1, 8)),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'pro',
    status TEXT NOT NULL DEFAULT 'active',
    billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
    amount NUMERIC NOT NULL DEFAULT 49,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '30 days') NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Team Members Table (RBAC Workspace Staff)
CREATE TABLE public.team_members (
    id TEXT PRIMARY KEY DEFAULT ('mem-' || substr(md5(random()::text), 1, 8)),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'business_staff' CHECK (role IN ('business_owner', 'business_staff')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Reviews Table
CREATE TABLE public.reviews (
    id TEXT PRIMARY KEY DEFAULT ('rev-' || substr(md5(random()::text), 1, 8)),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    service_type TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    what_stood_out TEXT DEFAULT '',
    what_could_improve TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_team_members_business_id ON public.team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies

-- Profiles
CREATE POLICY "Users can view their own profile or Super Admins can view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Businesses
CREATE POLICY "Public businesses are viewable by everyone"
    ON public.businesses FOR SELECT
    USING (true);

CREATE POLICY "Users can create their business"
    ON public.businesses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Business owners or Super Admins can update their business"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Business owners or Super Admins can delete their business"
    ON public.businesses FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

-- Subscriptions
CREATE POLICY "Business members can view their subscription"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE public.businesses.id = public.subscriptions.business_id
            AND (public.businesses.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members WHERE team_members.business_id = public.businesses.id AND team_members.user_id = auth.uid()))
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Business owners or Super Admins can manage subscriptions"
    ON public.subscriptions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE public.businesses.id = public.subscriptions.business_id
            AND public.businesses.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

-- Team Members
CREATE POLICY "Business members can view team"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE public.businesses.id = public.team_members.business_id
            AND (public.businesses.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.business_id = public.businesses.id AND tm.user_id = auth.uid()))
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Business owners can manage team members"
    ON public.team_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE public.businesses.id = public.team_members.business_id
            AND public.businesses.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

-- Reviews
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Anyone can submit a review"
    ON public.reviews FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Business members can manage reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE public.businesses.id = public.reviews.business_id
            AND (
                public.businesses.user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.team_members WHERE team_members.business_id = public.businesses.id AND team_members.user_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
            )
        )
    );

-- ==============================================================================
-- 11. SaaS Demo Seed Data
-- ==============================================================================

INSERT INTO public.businesses (id, name, category, services, google_review_url, email, plan_id, subscription_status, ai_credits_used, whatsapp_invites_used)
VALUES 
    (
        'demo-1',
        'Apex Auto Care & Diagnostics',
        'automobile',
        ARRAY['Full Synthetic Oil Change', 'Brake Pad Replacement', 'Engine Diagnostic', 'Tire Rotation & Balance', 'AC System Recharge'],
        'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        'admin@apexauto.com',
        'pro',
        'active',
        48,
        72
    ),
    (
        'demo-2',
        'Lumina Skin & Hair Studio',
        'salon',
        ARRAY['Balayage & Hair Styling', 'HydraFacial Glow', 'Keratin Smoothing Treatment', 'Gel Manicure & Pedicure'],
        'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        'admin@lumina.com',
        'starter',
        'active',
        22,
        35
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (id, business_id, plan_id, status, billing_interval, amount)
VALUES
    ('sub-101', 'demo-1', 'pro', 'active', 'monthly', 49),
    ('sub-102', 'demo-2', 'starter', 'active', 'monthly', 19)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.team_members (id, business_id, email, name, role, status)
VALUES
    ('mem-101', 'demo-1', 'owner@apexauto.com', 'Marcus Vance', 'business_owner', 'active'),
    ('mem-102', 'demo-1', 'staff@apexauto.com', 'Elena Rostova', 'business_staff', 'active'),
    ('mem-103', 'demo-1', 'service@apexauto.com', 'Liam Scott', 'business_staff', 'active'),
    ('mem-104', 'demo-2', 'admin@lumina.com', 'Sophia Chang', 'business_owner', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reviews (id, business_id, service_type, rating, text, what_stood_out, what_could_improve, created_at)
VALUES
    (
        'rev-101',
        'demo-1',
        'Brake Pad Replacement',
        5,
        'Had an outstanding experience getting my brake pads replaced. The technicians diagnosed the squeaking sound within minutes, explained everything transparently, and got me back on the road in under two hours. Clean waiting lounge and super friendly staff!',
        'Fast turnaround time and honest pricing without pushy upselling.',
        'Coffee machine in the lounge was out of order.',
        NOW() - INTERVAL '2 days'
    ),
    (
        'rev-102',
        'demo-1',
        'Full Synthetic Oil Change',
        5,
        'Super efficient oil change and complimentary 20-point safety inspection. The team treated my car with utmost care and even wiped down the dashboard. Highly recommend Apex Auto Care!',
        'Attention to detail and warm customer service.',
        '',
        NOW() - INTERVAL '5 days'
    ),
    (
        'rev-103',
        'demo-1',
        'Engine Diagnostic',
        4,
        'Great diagnostic work! They pinpointed a tricky check-engine light issue that another shop missed. The bill was reasonable. Would definitely return.',
        'Master mechanics who clearly know modern engine systems.',
        'Waited about 15 minutes past appointment time before car was taken in.',
        NOW() - INTERVAL '14 days'
    ),
    (
        'rev-104',
        'demo-1',
        'AC System Recharge',
        5,
        'Brought my car in on a 95-degree day with warm air blowing. They recharged the AC system promptly and it has been ice cold ever since! Top notch service.',
        'Prompt service on short notice.',
        '',
        NOW() - INTERVAL '22 days'
    )
ON CONFLICT (id) DO NOTHING;
