-- Remove the businesses <-> team_members RLS recursion.
-- Apply after 20261027_fix_admin_business_reads.sql.

CREATE OR REPLACE FUNCTION public.can_access_business(target_business_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.businesses b
        WHERE b.id = target_business_id
          AND b.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.team_members tm
        WHERE tm.business_id = target_business_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_business(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_business(text) TO authenticated;

DROP POLICY IF EXISTS "Super admins can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Tenant members can view their business" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON public.businesses;
DROP POLICY IF EXISTS "Public businesses are viewable" ON public.businesses;
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;

CREATE POLICY "Authenticated users can view businesses"
    ON public.businesses FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.can_access_business(id)
    );

DROP POLICY IF EXISTS "Super admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Tenant members can view team" ON public.team_members;
DROP POLICY IF EXISTS "Business members can view team" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can view team" ON public.team_members;

CREATE POLICY "Authenticated users can view team"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR public.can_access_business(business_id)
    );

DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Tenant members can view subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Business members can view their subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.subscriptions;

CREATE POLICY "Authenticated users can view subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.can_access_business(business_id)
    );

DROP POLICY IF EXISTS "Super admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Tenant members can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Business members can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can manage reviews" ON public.reviews;

CREATE POLICY "Authenticated users can manage reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.can_access_business(business_id)
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.can_access_business(business_id)
    );
