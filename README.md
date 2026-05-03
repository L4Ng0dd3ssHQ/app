# LandIt

> **Land the interview. Skip the guesswork.**
>
> Paste any job description + your resume → get a match score, missing skills, and ready-to-paste resume bullets in seconds.

LandIt is a single-purpose mobile app (Expo / React Native) that turns any job posting into an actionable, tailored application plan. No accounts, no dashboards, no noise — just paste and go.

---

## Features

- **Match Score (0–100)** — honest weighted overlap of required (70%) + preferred (30%) skills
- **Key Skills extraction** — categorized into Technical / Tools / Soft
- **Required vs Preferred** split, so you know what's non-negotiable
- **Missing Skills** — clear gap list (when a resume is provided)
- **Resume Bullet Rewrites** — BEFORE / AFTER pairs tailored to the JD, copy-paste ready
- **Focus Guidance** — 2–4 concrete next steps before you hit Apply
- **Local history** — every scan saved on-device via AsyncStorage, with detail view and delete/clear
- **Free tier** — 3 analyses per day, enforced client-side

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | Expo SDK 54, React Native 0.81, Expo Router (file-based) |
| UI | `expo-linear-gradient`, `@expo/vector-icons`, React Native StyleSheet |
| Storage | `@react-native-async-storage/async-storage` (device-local) |
| Backend | FastAPI, Uvicorn |
| DB | MongoDB (via Motor) |
| AI | OpenAI **GPT-5.2** via `emergentintegrations` + Emergent Universal LLM Key |

---

## Project Structure

```
/app
├── backend/
│   ├── server.py           # FastAPI app + /api/analyze endpoint
│   ├── requirements.txt
│   └── .env                # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY
├── frontend/
│   ├── app/
│   │   ├── _layout.tsx           # Root stack
│   │   ├── index.tsx             # Redirects to /(tabs)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # Bottom tab nav
│   │   │   ├── index.tsx         # Home
│   │   │   ├── analyze.tsx       # Paste JD + Resume → Result
│   │   │   ├── history.tsx       # Saved scans
│   │   │   └── about.tsx         # About / Pricing
│   │   └── result/[id].tsx       # Detail for a saved scan
│   ├── src/
│   │   ├── theme.ts              # Colors, spacing, types
│   │   ├── storage.ts            # AsyncStorage wrappers + quota
│   │   └── AnalysisView.tsx      # Shared result renderer
│   ├── app.json
│   ├── package.json
│   └── .env                      # EXPO_PUBLIC_BACKEND_URL
└── README.md
```

---

## API

**Base:** `${EXPO_PUBLIC_BACKEND_URL}/api`

### `GET /`
Health check. Returns `{"message": "LandIt API"}`.

### `POST /analyze`
Analyze a job posting against an optional resume.

**Request body**
```json
{
  "job_description": "string (required, min 30 chars)",
  "resume": "string (optional)"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "job_title": "Network Engineer",
  "match_score": 62,
  "key_skills": {
    "technical": ["VLANs", "DHCP", "NAT"],
    "soft": ["Communication", "Problem solving"],
    "tools": ["Azure VNet", "Network monitoring"]
  },
  "required_skills": ["VLANs", "Firewall configuration", ...],
  "preferred_skills": ["Azure networking", ...],
  "missing_skills": ["Azure", "Firewall configuration"],
  "suggested_bullets": [
    { "before": "Managed network systems.",
      "after": "Configured VLAN segmentation and implemented DHCP/NAT to support multi-department operations." }
  ],
  "focus_guidance": ["Add 1 cloud project", "Emphasize troubleshooting"],
  "summary": "Solid networking base; cloud gap is the main blocker.",
  "has_resume": true,
  "created_at": "2026-02-..."
}
```

**Errors**
- `400` — JD too short (<30 chars)
- `502` — AI provider error or malformed JSON

---

## Local Development

### Prerequisites
- Node 20+, Yarn
- Python 3.11+
- MongoDB running locally
- Emergent Universal LLM Key (or your own OpenAI key — edit `server.py`)

### Backend
```bash
cd backend
pip install -r requirements.txt
# .env:
#   MONGO_URL="mongodb://localhost:27017"
#   DB_NAME="landit"
#   EMERGENT_LLM_KEY="sk-emergent-..."
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
# .env:
#   EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
yarn start
```
Scan the QR code with Expo Go, or press `w` for the web preview.

---

## Environment Variables

### `backend/.env`
| Var | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name (analyses collection auto-created) |
| `EMERGENT_LLM_KEY` | Emergent Universal Key (powers GPT-5.2 access) |

### `frontend/.env`
| Var | Description |
|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | Public URL of the FastAPI backend |

---

## Design

Inspired by the Taco Bell app — bold purple `#7C2FB8`, white rounded cards with soft shadows, all-caps purple CTAs, bottom tab navigation. See `frontend/src/theme.ts` for the full token list.

---

## Roadmap

- [ ] **LandIt Pro ($7/mo)** — unlimited scans, saved resumes, job tracker
- [ ] Copy-to-clipboard on each bullet
- [ ] PDF export of results
- [ ] Tailored cover-letter generation
- [ ] iOS / Android app store builds

---

## License

Private. All rights reserved — © 2026.
