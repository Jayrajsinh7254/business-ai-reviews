-- ==============================================================================
-- ReviewAssist — Fix Reviews Table Schema & Policies for Instant Review Sync
-- ==============================================================================
-- Run this in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/sojryvohzlagalywpopf
-- 2. Click "SQL Editor" on the left menu
-- 3. Click "New Query", paste this entire script, and click "Run"
-- ==============================================================================

-- 1. Ensure reviews table has staff_id and staff_name columns for Staff Attribution Leaderboard
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS staff_id TEXT;

ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- 2. Ensure customer review submission is public and unrestricted
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review"
    ON public.reviews FOR INSERT
    WITH CHECK (true);

-- 3. Ensure reviews can be read by public and dashboard
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

-- 4. Enable index for fast business review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_business_created 
  ON public.reviews(business_id, created_at DESC);
