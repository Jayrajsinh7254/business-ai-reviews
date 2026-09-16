-- ==============================================================================
-- ReviewAssist — Supabase Complete Database Schema & Seed Data
-- ==============================================================================
-- Run this SQL in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running (optional, preserves clean state)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;

-- 3. Create Businesses Table
CREATE TABLE public.businesses (
    id TEXT PRIMARY KEY DEFAULT ('biz-' || substr(md5(random()::text), 1, 8)),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    services TEXT[] NOT NULL DEFAULT '{}',
    google_review_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Reviews Table
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

-- 5. Indexes for Fast Queries
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 7. Businesses Table Policies
-- Anyone can view businesses (needed for public customer review QR code flow)
CREATE POLICY "Public businesses are viewable by everyone"
    ON public.businesses FOR SELECT
    USING (true);

-- Authenticated users (or public registration) can create a business
CREATE POLICY "Users can create their business"
    ON public.businesses FOR INSERT
    WITH CHECK (true);

-- Business owner can update their business
CREATE POLICY "Owners can update their business"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Business owner can delete their business
CREATE POLICY "Owners can delete their business"
    ON public.businesses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 8. Reviews Table Policies
-- Anyone can view reviews (for dashboard and display)
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

-- Anyone (customers scanning QR code) can submit a review without logging in
CREATE POLICY "Anyone can submit a review"
    ON public.reviews FOR INSERT
    WITH CHECK (true);

-- Business owners can manage reviews for their own business
CREATE POLICY "Owners can manage their reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE public.businesses.id = public.reviews.business_id
            AND public.businesses.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 9. Demo Seed Data
-- ==============================================================================

INSERT INTO public.businesses (id, name, category, services, google_review_url, email)
VALUES 
    (
        'demo-1',
        'Apex Auto Care & Diagnostics',
        'automobile',
        ARRAY['Full Synthetic Oil Change', 'Brake Pad Replacement', 'Engine Diagnostic', 'Tire Rotation & Balance', 'AC System Recharge'],
        'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        'admin@apexauto.com'
    ),
    (
        'demo-2',
        'Lumina Skin & Hair Studio',
        'salon',
        ARRAY['Balayage & Hair Styling', 'HydraFacial Glow', 'Keratin Smoothing Treatment', 'Gel Manicure & Pedicure'],
        'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        'admin@lumina.com'
    )
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
