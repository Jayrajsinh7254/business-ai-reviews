# Technology Stack

> Repository stack map generated on 2026-10-27 from manifests and source
> configuration.

## Runtime

| Technology | Version | Purpose |
|---|---:|---|
| JavaScript | ES modules | Browser application language |
| React | `^19.2.8` | UI and component model |
| React DOM | `^19.2.8` | Browser rendering |
| React Router DOM | `^7.18.4` | Client-side routing |
| Vite | `^8.3.0` | Development server and production bundling |
| TypeScript/Deno TypeScript | Edge Function source only | Supabase serverless functions |

## Production Dependencies

| Package | Version | Purpose |
|---|---:|---|
| `@supabase/supabase-js` | `^2.116.0` | Supabase Auth, database, and Edge Function client |
| `canvas-confetti` | `^1.9.4` | Celebration UI effects |
| `qrcode` | `^1.5.4` | QR generation/rendering |
| `react` | `^19.2.8` | UI |
| `react-dom` | `^19.2.8` | React browser renderer |
| `react-router-dom` | `^7.18.4` | Routing |

## Development Dependencies

| Package | Version | Purpose |
|---|---:|---|
| `@types/react` | `^19.2.18` | React type declarations |
| `@types/react-dom` | `^19.2.7` | React DOM type declarations |
| `@vitejs/plugin-react` | `^6.1.1` | Vite React integration |
| `oxlint` | `^1.81.0` | JavaScript/JSX linting |
| `vite` | `^8.3.0` | Build and preview tooling |

## Infrastructure and External Services

| Service | Provider | Purpose |
|---|---|---|
| PostgreSQL/Auth/Edge Functions | Supabase | Main backend and identity |
| Large-language model | Google Gemini | AI review draft generation |
| Payments | Razorpay | Orders, checkout, payment verification, lifecycle webhooks |
| Hosting | Vercel | SPA deployment and HTTP security headers |
| Google Business Profile | Google | Final customer review destination |

## Configuration

| Variable | Used by | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.js` | Production Supabase mode |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.js` | Production Supabase mode |
| `VITE_API_BASE_URL` | `src/api/client.js` | Optional legacy HTTP API base; default is localhost:5000 |
| `VITE_RAZORPAY_KEY_ID` | `src/lib/razorpay.js` | Razorpay frontend checkout |
| `VITE_RAZORPAY_PLAN_STARTER_MONTHLY` | `src/lib/plans.js` | Optional recurring-plan metadata |
| `VITE_RAZORPAY_PLAN_STARTER_ANNUAL` | `src/lib/plans.js` | Optional recurring-plan metadata |
| `VITE_RAZORPAY_PLAN_PRO_MONTHLY` | `src/lib/plans.js` | Optional recurring-plan metadata |
| `VITE_RAZORPAY_PLAN_PRO_ANNUAL` | `src/lib/plans.js` | Optional recurring-plan metadata |
| `VITE_RAZORPAY_PLAN_ENTERPRISE_MONTHLY` | `src/lib/plans.js` | Optional recurring-plan metadata |
| `VITE_RAZORPAY_PLAN_ENTERPRISE_ANNUAL` | `src/lib/plans.js` | Optional recurring-plan metadata |
| `GEMINI_API_KEY` | `generate-review` Edge Function | AI generation |
| `RAZORPAY_KEY_ID` | `create-razorpay-order` Edge Function | Server-side order creation |
| `RAZORPAY_KEY_SECRET` | create/verify payment functions | Order auth and HMAC verification |
| `RAZORPAY_WEBHOOK_SECRET` | `razorpay-webhook` Edge Function | Webhook HMAC verification |
| `SUPABASE_URL` | Edge Functions | Server-side Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Trusted server-side database writes |

The three `VITE_*` Supabase/Razorpay variables determine browser behavior.
When Supabase variables are absent, the application intentionally falls back
to localStorage simulation. Server secrets must never be exposed as `VITE_*`
variables.

## Build and Deployment

- `npm run dev` starts Vite on port `5173` and listens on all hosts.
- `npm run build` creates the production bundle with no source maps and Oxc
  minification.
- `npm run preview` serves the production bundle on port `4173`.
- `npm run lint` runs Oxlint.
- Vite manually splits React, Supabase, QR/confetti, and remaining dependency
  vendors.
- [`vercel.json`](./vercel.json) rewrites all routes to the SPA entry point,
  sets security headers/CSP, and applies immutable caching to `/assets`.

## Database Assets

- [`supabase-schema.sql`](./supabase-schema.sql) is the initial schema and
  seed script.
- `supabase/migrations/` contains incremental review-link, RLS, and security
  changes.
- `supabase/functions/` contains four Deno Edge Functions for AI and billing.
- Root `supabase-*-fix.sql` files are operational repair scripts and should be
  treated as environment-specific runbooks until consolidated into migrations.

## Validation and Quality

The manifest provides lint and build commands but no configured unit,
integration, or end-to-end test runner. Validation currently consists of
Oxlint, Vite builds, manual browser flows, and the scratch payload script.
Before further feature development, establish a repeatable test boundary for
the public review flow, authenticated tenant isolation, admin authorization,
and payment state transitions.
