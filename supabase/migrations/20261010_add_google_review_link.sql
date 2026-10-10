-- ==============================================================================
-- Migration: Add google_review_link and configure column security
-- Date: 2026-10-10
-- ==============================================================================

-- 1. Add google_review_link column to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS google_review_link TEXT;

-- 2. Backfill existing businesses from google_review_url if null
UPDATE public.businesses
SET google_review_link = google_review_url
WHERE google_review_link IS NULL AND google_review_url IS NOT NULL;

-- 3. Set default placeholder for existing rows without any link
UPDATE public.businesses
SET google_review_link = 'https://g.page/r/example/review'
WHERE google_review_link IS NULL OR google_review_link = '';

-- 4. Secure column permissions:
-- Ensure anonymous (public customer) access only reads public safe fields
-- (name, category, services, google_review_link, id, status, subscription_status, created_at)
-- This protects private owner data such as email, phone, user_id, and payment info.
REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT (id, name, category, services, google_review_link, status, subscription_status, created_at)
ON public.businesses TO anon;

-- Ensure authenticated users retain required access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

COMMENT ON COLUMN public.businesses.google_review_link IS 'Direct destination Google Business Profile review link for customer flow forwarding';
