-- Public branding and contact links used by the customer review page.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

GRANT SELECT (
  id,
  name,
  category,
  services,
  google_review_link,
  logo_url,
  tagline,
  phone,
  address,
  website_url,
  instagram_url,
  facebook_url,
  youtube_url,
  status,
  subscription_status,
  created_at
) ON public.businesses TO anon, authenticated;
