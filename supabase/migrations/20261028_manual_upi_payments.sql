-- Manual UPI payment requests.
-- Payment requests are immutable from the client side after submission.

CREATE TABLE IF NOT EXISTS public.manual_payment_requests (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL CHECK (plan_id IN ('starter', 'pro', 'enterprise')),
    billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    upi_reference TEXT NOT NULL,
    customer_note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.manual_payment_requests ENABLE ROW LEVEL SECURITY;

GRANT INSERT, SELECT ON public.manual_payment_requests TO authenticated;
REVOKE UPDATE, DELETE ON public.manual_payment_requests FROM authenticated;

DROP POLICY IF EXISTS "Business users can submit manual payment requests" ON public.manual_payment_requests;
CREATE POLICY "Business users can submit manual payment requests"
    ON public.manual_payment_requests FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

DROP POLICY IF EXISTS "Business users can view manual payment requests" ON public.manual_payment_requests;
CREATE POLICY "Business users can view manual payment requests"
    ON public.manual_payment_requests FOR SELECT
    TO authenticated
    USING (public.is_super_admin() OR public.can_access_business(business_id));

CREATE INDEX IF NOT EXISTS idx_manual_payment_requests_status_created
    ON public.manual_payment_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manual_payment_requests_business_created
    ON public.manual_payment_requests (business_id, created_at DESC);
