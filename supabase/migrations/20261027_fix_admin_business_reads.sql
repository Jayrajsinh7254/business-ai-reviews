-- Ensure super admins can load the admin dashboard without cross-table RLS
-- recursion between businesses and team_members.

DROP POLICY IF EXISTS "Tenant members can view their business" ON public.businesses;
DROP POLICY IF EXISTS "Super admins can view all businesses" ON public.businesses;
CREATE POLICY "Super admins can view all businesses"
    ON public.businesses FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

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
    );

DROP POLICY IF EXISTS "Tenant members can view team" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can view all team members" ON public.team_members;
CREATE POLICY "Super admins can view all team members"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

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
    );

DROP POLICY IF EXISTS "Tenant members can view subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins can view all subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

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
              )
        )
    );

DROP POLICY IF EXISTS "Tenant members can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Super admins can manage all reviews" ON public.reviews;
CREATE POLICY "Super admins can manage all reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

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
              )
        )
    );
