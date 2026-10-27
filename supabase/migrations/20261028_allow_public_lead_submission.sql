-- Public visitors may submit contact requests, but cannot read or modify them.

GRANT INSERT ON TABLE public.leads TO anon;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;

CREATE POLICY "Public can submit leads"
    ON public.leads FOR INSERT
    TO anon
    WITH CHECK (true);
