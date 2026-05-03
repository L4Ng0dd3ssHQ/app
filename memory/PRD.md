# LandIt — PRD

## Vision
A single-purpose tool that turns any job posting into an actionable, tailored job-application plan in <30 seconds.
Tagline: **"Land the interview. Skip the guesswork."**

## Two Frontends
| Build | Location | Purpose |
|---|---|---|
| **Expo / React Native** | `/app/frontend` | Mobile (iOS / Android via Expo Go) |
| **React Web (Vite + Tailwind)** | `/app/web` | Vercel-deployable SPA |

Both call the same FastAPI backend.

## Core Features (both clients)
- Paste JD + optional resume → match score + skill extraction + missing skills + ready-to-paste resume bullets + focus guidance
- 3 free analyses / day (localStorage / AsyncStorage counter, reset daily)
- On-device history (last 50 scans, view detail, delete, clear)
- Brand: bold purple `#7C2FB8`, white rounded cards, Taco Bell-inspired

## Web-only Features (added this iteration)
- **Desktop layout (≥1024px):** wider container, 2-col input grid on /analyze, top-pill nav instead of bottom-tab nav
- **LandIt Pro ($7 / 30-day pass):** Stripe Checkout, unlocks unlimited analyses, persists in localStorage + Mongo `pro_devices` keyed by anonymous device_id (no auth)
- **Vercel Analytics:** custom events `analyze_clicked`, `analyze_succeeded`, `analyze_failed`, `quota_blocked`, `pro_checkout_started`, `pro_checkout_succeeded`
- **Copy-to-clipboard** on each rewritten resume bullet

## Backend (FastAPI, MongoDB)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/` | Health |
| POST | `/api/analyze` | GPT-5.2 structured analysis |
| POST | `/api/checkout` | Create Stripe Checkout session |
| GET | `/api/checkout/status/{id}` | Poll payment status (uses raw `stripe` SDK to bypass emergentintegrations pydantic v2 bug) |
| POST | `/api/webhook/stripe` | Stripe webhook receiver |
| GET | `/api/pro/{device_id}` | Check Pro status for a device |

Collections: `analyses`, `payment_transactions`, `pro_devices`.

## Pricing
- **Free** — 3 analyses/day
- **LandIt Pro $7** — 30-day pass, unlimited analyses (subscription auto-renew NOT enabled — one-time charge per period)

## Deployment
- **Backend:** Emergent (already live)
- **Web frontend:** Vercel (root dir `web/`, `VITE_BACKEND_URL` env var, included `vercel.json` handles SPA rewrites)

## Verified
- 11/11 backend pytest passing
- Web frontend e2e: home / analyze / pro / history / about / responsive layouts all render and function
- Real Stripe test session creates + status retrieves successfully
