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
   ```
4. Restart your Vite dev server:
   ```bash
   npm run dev
   ```

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
- **Offline & Graceful Fallback**: If `.env` credentials are not yet populated, ReviewAssist operates with an in-memory/localStorage mock store for testing.
