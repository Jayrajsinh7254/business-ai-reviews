# 🚀 Supabase Backend Setup Guide for ReviewAssist

ReviewAssist is configured to work out-of-the-box with **Supabase** for user authentication, cloud PostgreSQL database storage, real-time review collection, and AI review generation via Supabase Edge Functions with Google Gemini.

---

## ⚡ Setup Guide

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account or sign in.
2. Click **"New project"**, choose a project name (e.g. `ReviewAssist`), database password, and region.

---

### Step 2: Run the Database Schema & Seed Data
1. In your Supabase Project Dashboard, click on **SQL Editor** (the `>_` icon on the left navigation bar).
2. Click **"New query"**.
3. Copy the entire contents of [`supabase-schema.sql`](./supabase-schema.sql) and paste it into the editor.
4. Click **"Run"** (or `Ctrl+Enter`).
5. ✅ This will instantly create:
   - `businesses` table with Row-Level Security (RLS) policies
   - `reviews` table with customer submission policies & foreign key constraints
   - Pre-seeded demo businesses (`Apex Auto Care` & `Lumina Skin Studio`) and initial sample reviews.

---

### Step 3: Configure Your Environment Variables
1. In your Supabase dashboard, navigate to **Project Settings** (gear icon at bottom left) -> **API** (or **Data API**).
2. Copy:
   - **Project URL** (e.g. `https://sojryvohzlagalywpopf.supabase.co`)
   - **Project API Anon Key** (under `Project API keys` -> `anon` / `public` or `sb_publishable_...`)
3. Open the `.env` file in the root of this project and paste your keys:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_REVIEWASSIST_UPI_ID=your-business-upi-id@bank
   ```
4. Restart your Vite dev server:
   ```bash
   npm run dev
   ```

After the initial schema, apply the migrations in
[`supabase/migrations/`](./supabase/migrations/). The strict tenant migration
[`20261027_strict_tenant_rls.sql`](./supabase/migrations/20261027_strict_tenant_rls.sql)
is required for production authorization boundaries. Apply
[`20261027_fix_profile_rls_recursion.sql`](./supabase/migrations/20261027_fix_profile_rls_recursion.sql)
immediately afterward; it prevents PostgreSQL RLS recursion errors when
profile-based super-admin checks run.
Finally, apply
[`20261027_fix_admin_business_reads.sql`](./supabase/migrations/20261027_fix_admin_business_reads.sql)
so super admins can read all client businesses and team records without
cross-table RLS recursion.
If PostgreSQL still reports recursion on `businesses`, apply
[`20261027_fix_business_rls_recursion.sql`](./supabase/migrations/20261027_fix_business_rls_recursion.sql)
after it. This replaces the cross-table tenant checks with a
security-definer membership helper.

The admin dashboard loads its cross-tenant client list through the
`admin-manage-client` Edge Function. After updating
[`supabase/functions/admin-manage-client/index.ts`](./supabase/functions/admin-manage-client/index.ts),
redeploy that function from **Edge Functions** before testing the Clients or
Overview pages.

For public QR requests, apply
[`20261028_allow_public_lead_submission.sql`](./supabase/migrations/20261028_allow_public_lead_submission.sql).
It grants anonymous visitors insert-only access to `public.leads`; lead
reading and management remain restricted to super admins.

For private negative-feedback persistence, apply
[`20261028_secure_private_feedback.sql`](./supabase/migrations/20261028_secure_private_feedback.sql).
It creates tenant-scoped `public.private_feedback` storage, permits public
insert-only submissions, and restricts reads and status updates to the
business tenant or a super admin.

For manual UPI billing, apply
[`20261028_manual_upi_payments.sql`](./supabase/migrations/20261028_manual_upi_payments.sql).
Set `VITE_REVIEWASSIST_UPI_ID` to the UPI ID where clients should pay. Clients
submit a UPI transaction reference from the Subscription page; super admins
review requests at **Admin → UPI Payments**. Approving a request activates the
selected plan through the `admin-manage-client` Edge Function, so redeploy that
function after applying this migration.

---

### Step 4: Deploy AI Review Edge Function (`generate-review`)
ReviewAssist includes a Supabase Edge Function in [`supabase/functions/generate-review/index.ts`](./supabase/functions/generate-review/index.ts) powered by Google Gemini 3.5 Flash Lite with natural human-sounding review prompt engineering.

1. **Set the Gemini API Key Secret**:
   In your Supabase dashboard (**Project Settings** -> **Edge Functions** -> **Secrets**):
   - Key: `GEMINI_API_KEY`
   - Value: `<your_google_ai_studio_api_key>`

2. **Deploy the Function**:
   - In your Supabase Dashboard: **Edge Functions** -> click **generate-review** -> paste [`supabase/functions/generate-review/index.ts`](./supabase/functions/generate-review/index.ts) -> click **Deploy**.

---

## 🔒 Security & Architecture Overview

- **Row Level Security (RLS)**:
  - **Public Read Access**: Anyone can read business details and submit reviews via QR code link without authentication.
  - **Authenticated Access**: Business owners manage their own business profile and private analytics dashboard with Supabase Auth JWT sessions.
- **Edge Function with Gemini AI**:
  - Validates `businessId` and `whatStoodOut`.
  - Queries `businesses` table for business name and category.
  - Generates authentic, first-person Google review drafts with `gemini-3.5-flash-lite`.
- **Demo fallback only**: If `.env` credentials are not yet populated, ReviewAssist operates with an in-memory/localStorage mock store for development and demos. When Supabase credentials are configured, authentication and authorization do not fall back to localStorage.
