# LandIt — Web (React + Vite + Tailwind)

A single-page React web app for **LandIt** — paste a job description + resume and get a match score, missing skills, and ready-to-paste resume bullets.

This is the **web build** of LandIt, deployable to Vercel. It connects to the existing FastAPI backend.

---

## Stack
- **React 18** + **Vite 5** (TypeScript)
- **Tailwind CSS** (purple Taco-Bell-inspired theme)
- **React Router 6** (SPA routing)
- **lucide-react** icons
- **localStorage** for history + daily quota
- No backend code here — calls the FastAPI server at `VITE_BACKEND_URL`

---

## Local Development

```bash
cd web
yarn install            # or npm install / pnpm install
cp .env.example .env    # set VITE_BACKEND_URL
yarn dev                # http://localhost:5173
```

### Environment Variables
| Var | Description |
|---|---|
| `VITE_BACKEND_URL` | Public URL of the FastAPI backend (e.g. `https://job-match-scanner.preview.emergentagent.com`). Do **not** include `/api` — it's appended automatically. |

---

## Build

```bash
yarn build      # outputs to dist/
yarn preview    # serve the production build locally
```

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In **Vercel → New Project → Import** the repo.
3. **Root Directory:** set to `web/` (since the app is in a subfolder).
4. Vercel auto-detects Vite. Defaults are fine:
   - Build command: `yarn build` (or `vite build`)
   - Output directory: `dist`
5. Under **Environment Variables**, add:
   - `VITE_BACKEND_URL` = your FastAPI URL
6. Click **Deploy**.

`vercel.json` is already configured to rewrite all routes to `index.html` so React Router works on hard refresh.

> **Backend CORS:** the FastAPI server allows `*` origins, so no extra config is needed. If you tighten CORS later, add your Vercel domain to the allowed origins list.

---

## Project Structure

```
web/
├── public/favicon.svg
├── src/
│   ├── main.tsx              # React entry (BrowserRouter)
│   ├── App.tsx               # Route definitions
│   ├── index.css             # Tailwind directives + base styles
│   ├── api.ts                # fetch() wrapper for /api/analyze
│   ├── storage.ts            # localStorage helpers + daily quota
│   ├── types.ts              # Shared TS types
│   ├── components/
│   │   ├── Layout.tsx        # Phone-shell + bottom tab nav
│   │   └── AnalysisView.tsx  # Result renderer (score, pills, bullets)
│   └── pages/
│       ├── Home.tsx
│       ├── Analyze.tsx       # Two textareas + ANALYZE button
│       ├── History.tsx
│       ├── About.tsx
│       └── ResultDetail.tsx  # /result/:id
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── vercel.json               # SPA rewrite rule
└── .env.example
```

---

## Routes

| Path | Page |
|---|---|
| `/` | Home (hero + stats + how-it-works) |
| `/analyze` | Paste JD + Resume → result |
| `/history` | localStorage list of past scans |
| `/about` | About + pricing |
| `/result/:id` | Detail view of a saved scan |

---

## Notes
- **Mobile-first design.** On desktop, the app is centered in a 480px-wide phone-style shell with a bottom tab nav — matches the original Expo app's aesthetic exactly.
- **3 free analyses per day**, enforced client-side via localStorage.
- **Copy-to-clipboard** button on each rewritten resume bullet (web-only feature, an upgrade over the Expo version).
