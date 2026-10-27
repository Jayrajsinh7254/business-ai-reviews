# Architecture

> Repository map generated on 2026-10-27 from the current source tree. This
> describes implemented behavior and calls out places where documentation,
> schema, and runtime behavior differ.

## Overview

ReviewAssist is a React/Vite single-page SaaS application for collecting
customer feedback, generating review drafts, and helping local businesses
publish Google reviews. It has three user-facing surfaces:

1. A public marketing and contact surface.
2. A public QR/mobile review collection flow.
3. Authenticated business and super-admin workspaces.

Supabase is the production backend for authentication, PostgreSQL storage, Row
Level Security, realtime-adjacent synchronization, and Edge Functions. The
browser API layer also contains a substantial localStorage fallback for
explicit demo/development operation. It is not a production authentication
source and is not used as a credential fallback when Supabase is configured.

## System Diagram

```text
Browser
  |
  +-- main.jsx
        +-- ErrorBoundary
        +-- BrowserRouter
              +-- App.jsx
                    +-- AuthProvider
                    |     +-- api/client.js
                    |           +-- Supabase JS client (when configured)
                    |           +-- localStorage/mock stores (fallback)
                    |
                    +-- Public routes
                    |     +-- Home, Contact, Login, legal, Pricing
                    |     +-- ReviewPage (QR/customer flow)
                    |
                    +-- Business routes
                    |     +-- ProtectedRoute
                    |     +-- DashboardPage
                    |     +-- SubscriptionPage
                    |     +-- Team, billing, standee, AI-reply features
                    |
                    +-- Admin routes
                          +-- AdminProtectedRoute
                          +-- AdminLayout
                                +-- Overview, Inbox, QR Builder, Clients

Supabase
  +-- Auth users/profiles
  +-- PostgreSQL: businesses, subscriptions, reviews, leads,
  |                team_members, payment_events
  +-- Edge Functions
        +-- generate-review -> Google Gemini
        +-- create-razorpay-order -> Razorpay
        +-- verify-razorpay-payment -> Razorpay + database
        +-- razorpay-webhook -> Razorpay lifecycle + database
```

## Entry Points and Routing

- [`src/main.jsx`](./src/main.jsx) mounts the application with React Strict
  Mode, the router, and the global error boundary.
- [`src/App.jsx`](./src/App.jsx) defines lazy-loaded routes and layouts.
- Public review links support `/review`, `/review/:businessId`, `/r/:businessId`,
  and `/qr/:businessId`.
- Business routes are `/dashboard`, `/dashboard/:businessId`, and
  `/subscription`.
- Admin routes are `/admin/login`, `/admin`, `/admin/inbox`,
  `/admin/qr-builder`, and `/admin/clients`.
- Vercel rewrites all paths to `/`, allowing the SPA router to handle deep
  links.

## Components

### Authentication and authorization

- [`src/context/AuthContext.jsx`](./src/context/AuthContext.jsx) owns the
  browser session, active business, subscription, and team-member context.
  It persists user state locally and reloads business data on storage,
  BroadcastChannel, and custom event notifications.
- [`src/lib/rbac.js`](./src/lib/rbac.js) defines super-admin, business-owner,
  business-staff, and customer roles plus granular permissions.
- [`src/components/ProtectedRoute.jsx`](./src/components/ProtectedRoute.jsx)
  gates authenticated business pages.
- [`src/admin/AdminProtectedRoute.jsx`](./src/admin/AdminProtectedRoute.jsx)
  gates the admin console to the super-admin role.
- [`src/components/PermissionGate.jsx`](./src/components/PermissionGate.jsx)
  and plan helpers provide UI-level feature gating.

### API and persistence boundary

- [`src/api/client.js`](./src/api/client.js) is the central browser service
  layer. It implements signup/login/logout, business lookup and updates,
  review generation/submission, review statistics, subscriptions, teams,
  leads, client accounts, private feedback, and admin metrics.
- The client uses [`src/lib/supabase.js`](./src/lib/supabase.js) when both
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are valid.
- When Supabase is unavailable, the client enters demo mode and uses seeded
  demo businesses and localStorage stores. Production-mode authentication does
  not fall back to local credentials.

### Public customer flow

- [`src/pages/ReviewPage.jsx`](./src/pages/ReviewPage.jsx) collects rating,
  service, positive highlights, and improvement feedback.
- Positive feedback generates a review draft and can direct the customer to
  Google.
- Negative feedback is intercepted into private feedback for the business
  rather than being sent directly to Google.
- AI generation can use the `generate-review` Edge Function; local review
  generation utilities provide a fallback.

### Business workspace

- [`src/pages/DashboardPage.jsx`](./src/pages/DashboardPage.jsx) presents
  analytics, reviews, private feedback, QR/standee tools, team tools, AI
  reply tools, and campaign capabilities.
- [`src/lib/plans.js`](./src/lib/plans.js) defines Starter, Pro Growth, and
  Enterprise pricing and limits in INR.
- [`src/lib/razorpay.js`](./src/lib/razorpay.js) loads Razorpay Checkout and
  orchestrates order creation, client checkout, and payment verification.
- Standee, QR, social-story, leaderboard, competitor, and AI-reply behavior
  lives in reusable components and utilities under `src/components/` and
  `src/utils/`.

### Admin workspace

- `src/admin/` contains the isolated admin layout and views for platform
  metrics, lead inbox management, client account creation/maintenance, and QR
  building.
- Admin actions use the same API client and can update business/subscription
  records, credentials, leads, and team records.

## Data Flow

### Signup and login

1. Signup form data reaches `AuthContext.signup`.
2. `api.signup` attempts Supabase Auth/business creation when configured and
   maintains local records for compatibility.
3. Login first attempts Supabase Auth when configured, then resolves local
   credentials and business records as a fallback.
4. `AuthContext` persists the normalized user and loads business, subscription,
   and team data.

### Review collection

1. A QR/deep link identifies a business.
2. `api.getBusiness` loads public business configuration.
3. The customer enters rating and experience details.
4. Positive experiences call review draft generation; successful confirmation
   stores a review and updates business counters.
5. Negative experiences call private-feedback storage instead.
6. Browser events keep open dashboard/admin tabs current.

### Billing

1. The frontend calls `create-razorpay-order`.
2. The Edge Function validates plan/interval against a server-side price map,
   creates the Razorpay order, and records a pending `payment_events` row.
3. Razorpay Checkout returns payment identifiers to the browser.
4. The frontend calls `verify-razorpay-payment`, which verifies the HMAC,
   checks replay/order binding, and upserts the subscription.
5. `razorpay-webhook` independently records lifecycle events and updates
   subscription/business status.

## Database and Edge Functions

The base schema is [`supabase-schema.sql`](./supabase-schema.sql). It defines
`profiles`, `businesses`, `subscriptions`, `payment_events`, `team_members`,
`reviews`, and `leads`, plus indexes, seed data, and RLS policies.

The effective deployment must also apply the migrations in
[`supabase/migrations/`](./supabase/migrations/), especially
`20261025_harden_security_and_rls.sql`, which adds columns, tightens grants,
and creates atomic AI-credit functions. The base schema and hardening
migration do not express identical policies, so applying only the base schema
does not represent the documented hardened posture.

## Integrations

| Integration | Location | Purpose |
|---|---|---|
| Supabase Auth/Postgres | `src/lib/supabase.js`, `src/api/client.js` | Identity and tenant data |
| Supabase Edge Functions | `src/lib/razorpay.js`, `src/api/client.js` | Server-side AI and payment calls |
| Google Gemini | `supabase/functions/generate-review/index.ts` | Review draft generation |
| Razorpay | `src/lib/razorpay.js`, `supabase/functions/*razorpay*` | Checkout, verification, webhooks |
| Google review URLs | `src/lib/security.js`, `ReviewPage.jsx` | Sanitized customer handoff |
| Vercel | `vercel.json` | SPA hosting, security headers, rewrites |
| Browser storage/events | `src/api/client.js`, `AuthContext.jsx` | Offline fallback and cross-tab sync |

## Conventions

- React components and pages use PascalCase filenames; utilities and libraries
  use camelCase filenames.
- Pages are route-level components; reusable UI is in `components/`, admin UI
  is in `admin/`, and shared domain helpers are in `lib/` and `utils/`.
- Most data access is centralized in `api/client.js`; direct Supabase access
  remains in selected admin/payment paths.
- Error handling generally shows user-facing errors in pages and logs
  recoverable integration issues with `console.warn`/`console.error`.
- Code splitting uses `React.lazy` for route-level chunks and Vite manual
  vendor chunks.
- No unit/integration test framework is configured in `package.json`.
  `scratch/test-flow.mjs` is an ad-hoc payload check, not a test suite.

## Technical Debt and Boundaries

- [x] LocalStorage mode is explicitly limited to demo/development behavior;
  its data model remains separate from production Supabase authentication.
- [ ] Make the migration sequence authoritative and keep
  `supabase-schema.sql`, migrations, and `SUPABASE_SETUP.md` synchronized.
- [ ] Review RLS policies in the hardening migration: several authenticated
  policies use `USING (true)`, which is broader than tenant-scoped policies
  elsewhere in the schema.
- [ ] Centralize direct Supabase calls currently split between the API client,
  admin components, and billing helpers.
- [x] Replace the temporarily disabled browser-based admin client onboarding
  with a super-admin-verified Edge Function.
- [x] Admin client create/update/status/plan actions now route through the
  `admin-manage-client` Edge Function when Supabase is configured.
- [ ] Add automated tests for auth transitions, tenant isolation, review
  credit accounting, negative-feedback interception, and payment replay/order
  binding.
- [ ] Resolve the documented product/runtime inconsistencies such as trial
  durations and legacy routes before treating the behavior as a stable
  contract.
- [ ] Reduce or explicitly categorize the large `src/api/client.js` module;
  it currently combines transport, persistence, auth, domain validation, and
  local synchronization.
