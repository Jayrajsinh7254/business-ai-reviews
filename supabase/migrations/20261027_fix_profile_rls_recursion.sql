-- Fix recursive RLS evaluation for profile-based authorization checks.
-- Apply after 20261027_strict_tenant_rls.sql.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "Users can view their own profile or Super Admins can view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or Super Admins can view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_super_admin());

DROP POLICY IF EXISTS "Tenant members can view their business" ON public.businesses;
DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON public.businesses;
DROP POLICY IF EXISTS "Public businesses are viewable" ON public.businesses;
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;
CREATE POLICY "Tenant members can view their business"
    ON public.businesses FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.team_members tm
            WHERE tm.business_id = businesses.id
              AND tm.user_id = auth.uid()
              AND tm.status = 'active'
        )
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Authenticated users can create their business" ON public.businesses;
CREATE POLICY "Authenticated users can create their business"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Tenant owners or super admins can update business" ON public.businesses;
CREATE POLICY "Tenant owners or super admins can update business"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Tenant owners or super admins can delete business" ON public.businesses;
CREATE POLICY "Tenant owners or super admins can delete business"
    ON public.businesses FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can view leads" ON public.leads;
CREATE POLICY "Super admins can view leads"
    ON public.leads FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can update leads" ON public.leads;
CREATE POLICY "Super admins can update leads"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete leads" ON public.leads;
CREATE POLICY "Super admins can delete leads"
    ON public.leads FOR DELETE
    TO authenticated
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Tenant members can view subscription" ON public.subscriptions;
CREATE POLICY "Tenant members can view subscription"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = subscriptions.business_id
              AND (
                  b.user_id = auth.uid()
                  OR EXISTS (
                      SELECT 1
                      FROM public.team_members tm
                      WHERE tm.business_id = b.id
                        AND tm.user_id = auth.uid()
                        AND tm.status = 'active'
                  )
                  OR public.is_super_admin()
              )
        )
    );

DROP POLICY IF EXISTS "Tenant members can view team" ON public.team_members;
DROP POLICY IF EXISTS "Business members can view team" ON public.team_members;
CREATE POLICY "Tenant members can view team"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = team_members.business_id
              AND b.user_id = auth.uid()
        )
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Tenant owners or super admins can manage team" ON public.team_members;
DROP POLICY IF EXISTS "Business owners can manage team members" ON public.team_members;
CREATE POLICY "Tenant owners or super admins can manage team"
    ON public.team_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = team_members.business_id
              AND b.user_id = auth.uid()
        )
        OR public.is_super_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = team_members.business_id
              AND b.user_id = auth.uid()
        )
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Tenant members can manage reviews" ON public.reviews;
CREATE POLICY "Tenant members can manage reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = reviews.business_id
              AND (
                  b.user_id = auth.uid()
                  OR EXISTS (
                      SELECT 1
                      FROM public.team_members tm
                      WHERE tm.business_id = b.id
                        AND tm.user_id = auth.uid()
                        AND tm.status = 'active'
                  )
                  OR public.is_super_admin()
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = reviews.business_id
              AND (
                  b.user_id = auth.uid()
                  OR EXISTS (
                      SELECT 1
                      FROM public.team_members tm
                      WHERE tm.business_id = b.id
                        AND tm.user_id = auth.uid()
                        AND tm.status = 'active'
                  )
                  OR public.is_super_admin()
              )
        )
    );
