-- ReviewAssist strict tenant authorization
-- Apply after the existing schema and security migrations.
--
-- Public customers may read only the public business projection and submit
-- reviews/leads. Authenticated tenant access is scoped to an owner, an active
-- team member, or a super admin. Subscription mutations remain server-side.

-- Remove broad policies from the initial schema and prior hardening migration.
DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON public.businesses;
DROP POLICY IF EXISTS "Public businesses are viewable" ON public.businesses;
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their business" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Business owners or Super Admins can update their business" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Business owners or Super Admins can delete their business" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can delete businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Business members can view their subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Business owners or Super Admins can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Business members can view team" ON public.team_members;
DROP POLICY IF EXISTS "Business owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Business members can manage reviews" ON public.reviews;

-- Public business projection. Private columns are not granted to anon.
REVOKE ALL ON public.businesses FROM anon;
GRANT SELECT (id, name, category, services, google_review_link, logo_url, tagline, status, subscription_status, created_at)
ON public.businesses TO anon;

CREATE POLICY "Public can view active business profile"
    ON public.businesses FOR SELECT
    TO anon
    USING (COALESCE(status, 'active') <> 'inactive');

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
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Authenticated users can create their business"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Tenant owners or super admins can update business"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Tenant owners or super admins can delete business"
    ON public.businesses FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

-- Leads contain contact information and are admin-only after submission.
REVOKE SELECT, UPDATE, DELETE ON public.leads FROM anon;

CREATE POLICY "Super admins can view leads"
    ON public.leads FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update leads"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete leads"
    ON public.leads FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

-- Subscription rows are readable by tenant members. Writes happen through
-- trusted Edge Functions using the service role, not from the browser.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_business_id_unique
    ON public.subscriptions (business_id);

REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_credentials(TEXT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_credentials(TEXT, TEXT, TEXT) TO service_role;

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
                  OR EXISTS (
                      SELECT 1
                      FROM public.profiles p
                      WHERE p.id = auth.uid()
                        AND p.role = 'super_admin'
                  )
              )
        )
    );

-- Team records are tenant-scoped. Only owners and super admins mutate them.
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
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

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
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = team_members.business_id
              AND b.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

-- Reviews remain public to support the customer flow, but authenticated
-- mutations are restricted to the review's tenant.
CREATE POLICY "Public can submit reviews"
    ON public.reviews FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Public can view reviews"
    ON public.reviews FOR SELECT
    TO anon
    USING (true);

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
                  OR EXISTS (
                      SELECT 1
                      FROM public.profiles p
                      WHERE p.id = auth.uid()
                        AND p.role = 'super_admin'
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
                  OR EXISTS (
                      SELECT 1
                      FROM public.profiles p
                      WHERE p.id = auth.uid()
                        AND p.role = 'super_admin'
                  )
              )
        )
    );
