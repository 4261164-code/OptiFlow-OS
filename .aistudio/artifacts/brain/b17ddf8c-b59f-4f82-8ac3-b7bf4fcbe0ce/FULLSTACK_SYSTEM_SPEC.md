# OptiFlow OS — Full-Stack Technical Architecture & Production Blueprint

## 1. High-Level System Architecture & Topology

**OptiFlow OS** is an autonomous affiliate revenue operating system designed to automate the entire lifecycle of content-driven performance marketing: niche discovery, SEO article generation, social creative synthesis (Pinterest pins), multi-armed bandit traffic routing, conversion postback tracking, and subscription monetization.

### System Diagram & Flow

```
                      +---------------------------------------+
                      |               CLIENT                  |
                      |   React 19 + Vite SPA (TypeScript)    |
                      |   Tailwind CSS + Lucide Icons         |
                      +-------------------+-------------------+
                                          |
                        Auth State (Firebase Client SDK)
                                          |
                      +-------------------v-------------------+
                      |       EXPRESS REVERSE PROXY / API     |
                      |               (server.ts)             |
                      +-------------------+-------------------+
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
+-----------v-----------+     +-----------v-----------+     +-----------v-----------+
|    Public Routes      |     | Authenticated Routes  |     |  Background Daemons   |
|  - /go/:offerId       |     |  - /api/articles      |     |  - Worker Pipeline    |
|  - /go/smart/:niche   |     |  - /api/pins          |     |  - Bandit Re-weighter |
|  - /api/webhooks      |     |  - /api/billing       |     |  - Telemetry Event    |
|  - /api/billing/wh    |     |  - /api/analytics     |     |    Bus (SSE)          |
+-----------+-----------+     +-----------+-----------+     +-----------+-----------+
            |                             |                             |
            +-----------------------------+-----------------------------+
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
+-----------v-----------+     +-----------v-----------+     +-----------v-----------+
|  Firebase Firestore   |     |    Gemini AI Engine   |     |  Stripe Billing Engine|
|  - users / profiles   |     |  - @google/genai      |     |  - Subscriptions      |
|  - articles & pins    |     |  - Gemini 2.5 Flash   |     |  - Webhook listener   |
|  - clicks & postbacks |     |  - Title & copy gen   |     |  - Customer portal    |
|  - revenue_metrics    |     |  - Schema markup      |     |  - Plan enforcement   |
+-----------------------+     +-----------------------+     +-----------------------+
```

---

## 2. Layer-by-Layer Architectural Audit

### 2.1 Frontend Client Layer
- **Core Technology**: React 19, Vite, TypeScript, Tailwind CSS, Lucide React icons.
- **Routing**: Client-side navigation via React State & URL view routing (`App.tsx` and `AppLayout.tsx`).
- **Authentication Lifecycle**:
  - `src/lib/auth.ts`: Integrated with Firebase Authentication (Google Auth Provider).
  - **Graceful Error Handling**: Automatically absorbs and handles `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, and `auth/popup-blocked` without throwing unhandled rejections or jarring error toasts.
  - `apiFetch` wrapper automatically injects `Authorization: Bearer <firebase_id_token>` for authenticated backend communication.
- **UI Architecture**:
  - `src/components/executive/`: Executive summary dashboards, analytics cards, error boundaries.
  - `src/components/billing/BillingSubscriptionPanel.tsx`: Full-featured billing hub supporting monthly/yearly intervals, live plan comparison, usage bars (campaigns, clicks, AI generations), Stripe Checkout initiation, Customer Portal, and instant test simulator.
  - `src/components/analytics/LiveTrafficPulse.tsx`: Real-time telemetry visualizer consuming Server-Sent Events (`/api/analytics/live-pulse`) with interactive traffic simulation.
  - `src/components/ArticleGenerator.tsx`: AI content studio with live keyword research, tone configuration, and preview.
  - `src/components/PinStudio.tsx`: High-converting Pinterest creative generator with dynamic banner rendering and direct scheduling.

### 2.2 Server & API Gateway Layer (`server.ts`)
- **Runtime**: Node.js + Express with `tsx` execution.
- **Authentication Gateway**:
  - Intercepts `/api/*` routes.
  - Public exemptions: `/health`, `/health/*`, `/postback`, `/api/webhooks`, `/api/billing/webhook`, and `/go/*` redirector routes.
  - Authenticated routes verify Google ID tokens via `firebase-admin/auth`.
- **Redirect & Traffic Routing (`/go/*`)**:
  - `/go/:offerId`: Direct click tracking redirector. Captures IP, User Agent, Referer, Device type (desktop/mobile/tablet), and Geographic country headers (`cf-ipcountry`, `x-country-code`).
  - `/go/smart/:nicheId`: Epsilon-Greedy Multi-Armed Bandit routing engine. Distributes incoming traffic across active offers in a niche (90% to highest EPC offer, 10% exploring challenger offers) to maximize affiliate yield.
  - Generates cryptographic `clickId` values stored in `affiliate_clicks` with an expiration TTL.
- **Postback Webhook (`/api/webhooks/postback`)**:
  - Ingests S2S affiliate postbacks from affiliate networks (MaxBounty, ClickBank, CJ, etc.).
  - Validates HMAC SHA-256 signatures via `x-postback-signature` or query parameters (with development mode resilience).
  - Updates click state from `clicked` to `converted`, credits commission revenue, recalculates EPC/CTR metrics, and publishes real-time events to `telemetryHub`.
- **Billing API (`/api/billing`)**:
  - `GET /plans`: Returns pricing tiers (Starter $49/mo, Growth $149/mo, Enterprise $399/mo) and feature allocations.
  - `GET /status`: Queries current user subscription tier, renewal date, and live resource usage vs limits.
  - `POST /create-checkout-session`: Generates Stripe Checkout sessions for subscription upgrades.
  - `POST /create-portal-session`: Generates Stripe Billing Customer Portal URLs.
  - `POST /webhook`: Handles Stripe webhook events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`).
  - `POST /simulate-upgrade`: Built-in sandbox mode allowing zero-friction testing of tier upgrades in development without live payment credentials.
- **Live Telemetry & SSE (`/api/analytics`)**:
  - `GET /live-pulse`: SSE stream transmitting in-flight clicks, conversions, bandit allocations, and bot mitigations to connected clients.
  - `GET /live-recent`: Returns rolling buffer of the last 50 telemetry events.
  - `POST /simulate-traffic`: Injects mock traffic events into the telemetry bus for testing analytics dashboards.

### 2.3 Database & Schema (Google Firestore)
The persistence layer is structured around the following core collections:
1. `users/{userId}`: User profile, API keys (MaxBounty, Pinterest), subscription details (`planId`, `status`, `currentPeriodEnd`, `stripeCustomerId`).
2. `articles/{articleId}`: Generated SEO articles with title, outline, body, target keywords, affiliate link insertions, and publication status.
3. `pins/{pinId}`: Generated Pinterest pins with title, description, image URL, target URL, board ID, and scheduling timestamps.
4. `affiliate_offers/{offerId}`: Network offers with EPC, payout amount, category/niche, tracking URL templates, and conversion counts.
5. `affiliate_clicks/{clickId}`: Individual click telemetry (offerId, timestamp, device, country, IP hash, userAgent, converted status).
6. `affiliate_conversions/{conversionId}`: Verified postback records (clickId, payout, currency, transactionId, network).
7. `revenue_metrics/{metricId}`: Aggregated daily/weekly performance rollup (clicks, conversions, EPC, total revenue, CTR).
8. `system_locks/{lockKey}`: Distributed locks for scheduled worker tasks to prevent split-brain executions across server instances.

### 2.4 Autonomous AI Engine (Gemini 2.5 Flash)
- **SDK**: Modern `@google/genai` TypeScript SDK.
- **Pipelines**:
  1. **Niche Keyword Intelligence**: Researches high-intent commercial keywords with search volume and competition scores.
  2. **Long-Form SEO Article Writer**: Generates 1,500-2,500 word comprehensive reviews and comparisons, including FAQ schema markup and contextual affiliate callout boxes.
  3. **Pinterest Viral Creative Synthesis**: Crafts pin titles, keyword-dense descriptions, and visual layout parameters optimized for Pinterest image feeds.
  4. **Multi-Armed Bandit Self-Learning**: Periodically computes historical EPC and rebalances traffic allocation toward high-yield creative and offer combinations.

---

## 3. Resolved Issues & Fortification Audit

| Issue / Error | Root Cause | Solution Implemented |
|---|---|---|
| `auth/cancelled-popup-request` | Rapid consecutive sign-in clicks cancelled earlier popup requests. | `src/lib/auth.ts` now prevents concurrent popup triggers and safely swallows benign cancellation. |
| `auth/popup-blocked` | Browser iframe sandbox or user popup blockers blocked `window.open`. | `loginWithGoogle` catches blocked popup error, suppresses unhandled exceptions, and returns `{ error }` payload with friendly actionable feedback. |
| `auth/popup-closed-by-user` | User closed Google sign-in window before finishing consent. | Treated as a normal user dismissal rather than a system crash; logged at debug level only. |
| Missing Billing Infrastructure | App had no revenue/monetization layer. | Implemented full Stripe billing routes (`/api/billing/*`), webhook handler, test simulator, and UI panel (`BillingSubscriptionPanel.tsx`). |
| Missing Live Telemetry Stream | Analytics had only static snapshots with no live feed. | Built SSE `/api/analytics/live-pulse`, in-memory `telemetryHub`, and `LiveTrafficPulse.tsx` real-time radar widget. |

---

## 4. Full Production Completion Checklist

To transition this application from the current fully working development state to high-scale enterprise production:

### 1. Environment Configurations
- [ ] Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in production `.env` (currently defaults to interactive sandbox simulator).
- [ ] Set `GEMINI_API_KEY` for server-side generative AI content generation.
- [ ] Set `POSTBACK_SECRET_SALT` for cryptographically verified postbacks from affiliate networks.

### 2. Affiliate Network Integrations
- [ ] Configure Postback URL in MaxBounty / ClickBank / Impact:
  ```
  https://<your-domain>/api/webhooks/postback?clickId=#SUBID#&payout=#RATE#&sig=#SIGNATURE#
  ```
- [ ] Verify IP whitelist for affiliate network webhook delivery.

### 3. Pinterest Direct Publishing API
- [ ] Complete Pinterest App review for `boards:read,write` and `pins:read,write` scopes for direct scheduled pin publishing.

### 4. Custom Tracking Domain & CDN
- [ ] Route `/go/*` links through Cloudflare or Fastly CDN with caching rules to optimize redirect latency (< 50ms global TTFB).
- [ ] Enable SSL on custom affiliate redirect domains to prevent browser warning interstitials.

### 5. Automated Backups & Scalability
- [ ] Schedule nightly Firestore collection exports to Google Cloud Storage.
- [ ] Configure Cloud Monitoring alerts for conversion rate drops or webhook signature validation anomalies.
