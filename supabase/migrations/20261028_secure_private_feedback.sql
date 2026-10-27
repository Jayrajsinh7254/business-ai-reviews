-- Persist negative-review intercepts in Supabase with public write-only access.

CREATE TABLE IF NOT EXISTS public.private_feedback (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL DEFAULT 'General Service',
    rating INTEGER NOT NULL DEFAULT 2 CHECK (rating >= 1 AND rating <= 5),
    issue TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL DEFAULT 'Anonymous Customer',
    customer_contact TEXT NOT NULL DEFAULT '',
    customer_email TEXT NOT NULL DEFAULT '',
    preferred_resolution TEXT NOT NULL DEFAULT 'Phone call from owner/manager',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.private_feedback ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.private_feedback TO anon, authenticated;
REVOKE SELECT, UPDATE, DELETE ON public.private_feedback FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.private_feedback TO authenticated;

DROP POLICY IF EXISTS "Public can submit private feedback" ON public.private_feedback;
CREATE POLICY "Public can submit private feedback"
    ON public.private_feedback FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view private feedback" ON public.private_feedback;
CREATE POLICY "Authenticated users can view private feedback"
    ON public.private_feedback FOR SELECT
    TO authenticated
    USING (public.is_super_admin() OR public.can_access_business(business_id));

DROP POLICY IF EXISTS "Authenticated users can update private feedback" ON public.private_feedback;
CREATE POLICY "Authenticated users can update private feedback"
    ON public.private_feedback FOR UPDATE
    TO authenticated
    USING (public.is_super_admin() OR public.can_access_business(business_id))
    WITH CHECK (public.is_super_admin() OR public.can_access_business(business_id));

CREATE INDEX IF NOT EXISTS idx_private_feedback_business_created
    ON public.private_feedback (business_id, created_at DESC);
