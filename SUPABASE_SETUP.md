# 🚀 Supabase Backend Setup Guide for ReviewAssist

ReviewAssist is configured to work out-of-the-box with **Supabase** for user authentication, cloud PostgreSQL database storage, and real-time review collection.

---

## ⚡ Quick 3-Step Setup (Takes < 2 minutes)

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
   - **Project URL** (e.g. `https://xyzprojectref.supabase.co`)
   - **Project API Anon Key** (under `Project API keys` -> `anon` / `public`)
3. Open the `.env` file in the root of this project and paste your keys:
   ```env
   VITE_SUPABASE_URL=https://xyzprojectref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Restart your Vite dev server:
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Architecture Overview

- **Row Level Security (RLS)**:
  - **Public Read Access**: Anyone can read business details and submit reviews via QR code link without authentication.
  - **Authenticated Access**: Business owners manage their own business profile and private analytics dashboard with Supabase Auth JWT sessions.
- **Offline & Graceful Fallback**: If `.env` credentials are not yet populated, ReviewAssist operates with an in-memory/localStorage mock store for testing.

---

## 🛠 Features Enabled with Supabase
- **Instant Signup (`/signup`)**: Creates Supabase Auth credentials + registers business in Postgres.
- **Secure Sign In (`/login`)**: Authenticates with Supabase Auth, retrieves linked business profile, and redirects to dashboard.
- **Live Review Submission (`/review/:businessId`)**: Inserts customer reviews directly into the Supabase database.
- **Real-Time Dashboard Analytics (`/dashboard/:businessId`)**: Calculates review counts, monthly growth, conversion rates, and star ratings straight from Supabase tables.
