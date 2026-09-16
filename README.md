# ReviewAssist — AI-Powered Google Reviews Collector

ReviewAssist is a high-converting web application that helps businesses turn in-person customer visits into detailed, authentic 5-star Google Reviews in 30 seconds using AI.

---

## 🚀 Supabase Backend Setup

ReviewAssist includes ready-to-use **Supabase** backend support for PostgreSQL database storage and authentication.

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the queries in [`supabase-schema.sql`](./supabase-schema.sql).
3. Copy your **Project URL** and **Anon Key** into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

For detailed instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

---

## 🛠 Features

- **Business Onboarding (`/signup`)**: Register business name, category, services, and owner credentials to generate a custom review QR code.
- **Dedicated Login (`/login`)**: Secure Supabase Auth with quick 1-click demo accounts.
- **Customer Mobile Review Flow (`/review/:businessId`)**: 3-step mobile-first wizard that crafts personalized review drafts with one-click copy to Google Reviews.
- **Business Owner Dashboard (`/dashboard/:businessId`)**: Real-time analytics, rating tracking, scan conversion rates, and review feedback management.
