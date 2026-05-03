# JobMatch Analyzer — PRD

## Vision
A single-purpose mobile tool that turns any job posting into an actionable, tailored job-application plan in <30 seconds.

## Core User Flow (MVP)
1. Open app → Home (purple hero, 3/3 quota visible).
2. Tap **Analyze a Job** → paste JD (required) and resume (optional).
3. Tap **ANALYZE** → 5–15s wait → structured result.
4. Result auto-saved to local **History** for later review.

## Features Implemented
- **Tab navigation:** Home / Analyze / History / About (bottom tabs, purple active state).
- **Home:** Purple gradient hero "Manifest Your Match", live stats (past scans, scans today), 3-step how-it-works, benefit cards, dual CTAs.
- **Analyze:** Two textareas, char counter, ANALYZE button auto-disables for JD <30 chars, loading state, alert on quota exceeded.
- **Result view:** Job title, summary, match-score circle (color-coded green/amber/red), Required vs Preferred skill pills, categorized Key Skills (technical/tools/soft), Missing Skills (red pills), Resume Bullet rewrites (BEFORE/AFTER), numbered Focus Guidance.
- **History:** Local AsyncStorage list, color-coded score badge, tap to open detail, long-press to delete, Clear All.
- **About:** Pricing tiers (Free 3/day, Pro coming soon), privacy note, mailto notify-me.
- **Quota:** 3 analyses/day enforced via AsyncStorage daily counter.

## Tech Stack
- Expo Router (file-based), React Native 0.81, expo-linear-gradient, AsyncStorage, @expo/vector-icons.
- FastAPI backend, MongoDB (analyses persisted), `emergentintegrations` LlmChat → **OpenAI GPT-5.2** via EMERGENT_LLM_KEY.
- Single endpoint `POST /api/analyze` returns strict JSON.

## Backend API
- `GET /api/` → health
- `POST /api/analyze` body `{job_description, resume?}` → `AnalysisResult` (id, job_title, match_score, key_skills{technical,soft,tools}, required_skills, preferred_skills, missing_skills, suggested_bullets[{before,after}], focus_guidance, summary, has_resume, created_at).

## Design
Taco Bell-inspired purple aesthetic: `#7C2FB8` primary, white cards (16-radius, soft shadow), purple-soft pill badges, bold all-caps CTAs.

## Monetization (future)
Pro $7/mo: unlimited scans, saved resumes, job tracker.

## Tested
- Backend: 4/4 pytest passed (schema, validation, GPT-5.2 live).
- Frontend e2e: full analyze flow, quota decrement, history persistence, navigation all verified.
