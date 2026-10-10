# ReviewAssist — Launch & Production Deployment Guide 🚀

## 1. Credentials & Configuration Checklist

- **Official WhatsApp Support:** `+91 95373 70561`
- **Support & Legal Email:** `support.reviewassist@gmail.com`
- **Super Admin Login Portal:** `/admin/login` (Admin auth is handled securely via Supabase Auth server-side; set the admin account password in your Supabase Auth dashboard)
- **Payment Method:** Option B (Direct UPI / WhatsApp activation enabled + Razorpay gateway ready)

---

## 2. Supabase Backend Setup & Security Hardening

Your frontend is connected to your Supabase project:
- **Project URL:** `https://sojryvohzlagalywpopf.supabase.co`
- **Local Credentials:** Kept in `.env.local` (gitignored for safety)
- **Environment Template:** Stored in `.env` (placeholders only)

### A. Apply Database Schema & Row Level Security (RLS)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) → Open your project.
2. Navigate to **SQL Editor** in the left sidebar.
3. Open [`supabase-rls-hardening.sql`](./supabase-rls-hardening.sql) from the project root.
4. Copy and paste the entire script into a **New Query** and click **Run**.
5. This locks down all tables:
   - `leads`: Visitors can only insert inquiries; only Super Admins can view or update.
   - `payment_events`: Payment audit logs restricted to Admins and specific account owners.
   - `businesses`, `subscriptions`, `team_members`, `reviews`: Protected with strict role-based access.

### B. Deploy the Edge Function (`generate-review`) with Rate Limiting
The Edge Function includes category profiles (Auto, Salon, Dental, Tech/IT, Dining, etc.) and built-in sliding-window IP rate limiting (10 requests/minute):

#### Via Supabase Dashboard:
1. Go to **Edge Functions** in the Supabase dashboard.
2. Open or create the `generate-review` function.
3. Copy the entire content of [`supabase/functions/generate-review/index.ts`](supabase/functions/generate-review/index.ts) and paste it into the editor.
4. Click **Deploy**.

#### Via Supabase CLI:
```bash
npx supabase functions deploy generate-review --no-verify-jwt
```

### C. Verify Secrets
In Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**, ensure you have:
- `GEMINI_API_KEY` = *[Your Google Gemini API Key]*
- *(Optional)* `GEMINI_MODELS` = `gemini-1.5-flash,gemini-2.0-flash,gemini-1.5-flash-latest`

### D. Supabase Auth Setting for Instant Onboarding
In Supabase Dashboard → **Authentication** → **Providers** → **Email**:
- Turn **OFF** "Confirm email" if you want users to register and immediately land on their dashboard without waiting for an email confirmation link.

---

## 3. Deploying to Vercel (Under 3 Minutes)

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Production ready: security headers, code-splitting, RLS hardening, and rate-limiting"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new) and log in.
2. Select your repository: `business-ai-reviews`.
3. Framework Preset: **Vite** (automatically detected).
4. Root Directory: `./` (leave default).

### Step 3: Add Environment Variables in Vercel
Under **Project Settings** → **Environment Variables**, add:
| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://sojryvohzlagalywpopf.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *[Your Supabase Anon / Publishable Key]* |

### Step 4: Click "Deploy"
Vercel will build and deploy your app in ~45 seconds.

### What Is Already Hardened in Vercel Deployment:
- **Enterprise Security Headers:** Configured in `vercel.json` (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Permissions-Policy`).
- **Code-Splitting & Lazy Loading:** The initial app JavaScript bundle was reduced by **93.8%** (from 914 kB down to 57 kB), allowing customers scanning review QR codes on mobile to load pages instantly.
- **Cache Policy:** Immutable caching for static assets in `dist/assets/`.
- **SPA Rewrites:** Clean client-side routing across all paths without 404s.

---

## 4. How Payments Work with Option B

1. When a client visits `/pricing` or clicks **Upgrade** on their dashboard, they see the plan options (Starter, Pro, Enterprise).
2. Inside the checkout modal and on `/checkout`, there is a prominent **"💬 Pay via WhatsApp / UPI (+91 95373 70561)"** button.
3. Tapping it opens a direct WhatsApp chat with you with their business name and plan selection prefilled.
4. Once they send payment via GPay / PhonePe / Paytm / Bank, you open your **Super Admin Portal** (`/admin`), find their business, and set their subscription to **Active** with 1 click.
