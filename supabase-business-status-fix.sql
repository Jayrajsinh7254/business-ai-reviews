-- ==============================================================================
-- ReviewAssist — Fix Business Status & Subscription RLS for Admin & Customer
-- ==============================================================================
-- Run this in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/sojryvohzlagalywpopf
-- 2. Click "SQL Editor" on the left menu
-- 3. Click "New Query", paste this entire script, and click "Run"
-- ==============================================================================

-- 1. Ensure businesses table has `status` and `paid_until` columns
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS paid_until TIMESTAMP WITH TIME ZONE;

-- 2. Drop old restrictive CHECK constraint on subscription_status if it exists
DO $$
BEGIN
    ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_subscription_status_check;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Add updated constraint that allows 'inactive', 'active', 'trialing', 'canceled', 'past_due'
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_subscription_status_check 
  CHECK (subscription_status IN ('trialing', 'active', 'inactive', 'canceled', 'past_due'));

-- 4. Ensure status check constraint allows 'active', 'inactive', 'trial'
DO $$
BEGIN
    ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_status_check;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_status_check 
  CHECK (status IN ('active', 'inactive', 'trial'));

-- 5. Update subscriptions table check constraint as well
DO $$
BEGIN
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 6. Enable permissive policies on businesses so Admin can update status and public can read
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow select on businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow update on businesses" ON public.businesses;

CREATE POLICY "Allow select on businesses"
    ON public.businesses FOR SELECT
    USING (true);

CREATE POLICY "Allow update on businesses"
    ON public.businesses FOR UPDATE
    USING (true);

-- 7. Realtime broadcast for businesses status change
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
