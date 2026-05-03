from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ===== Models =====
class AnalyzeRequest(BaseModel):
    job_description: str
    resume: Optional[str] = ""


class KeySkills(BaseModel):
    technical: List[str] = []
    soft: List[str] = []
    tools: List[str] = []


class BulletSuggestion(BaseModel):
    before: str
    after: str


class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_title: str = "Job Analysis"
    match_score: int = 0
    key_skills: KeySkills = Field(default_factory=KeySkills)
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    missing_skills: List[str] = []
    suggested_bullets: List[BulletSuggestion] = []
    focus_guidance: List[str] = []
    summary: str = ""
    has_resume: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


SYSTEM_PROMPT = """You are an elite career coach and ATS expert. Analyze a job description and (optionally) a user's resume.

Return STRICT JSON only - no prose, no markdown, no code fences. The JSON MUST match this schema exactly:

{
  "job_title": "<short title extracted from JD, max 60 chars>",
  "match_score": <integer 0-100, 0 if no resume provided>,
  "key_skills": {
    "technical": ["<skill>", ...],
    "soft": ["<skill>", ...],
    "tools": ["<tool/platform>", ...]
  },
  "required_skills": ["<must-have skill>", ...],
  "preferred_skills": ["<nice-to-have skill>", ...],
  "missing_skills": ["<skill in JD but not in resume>", ...],
  "suggested_bullets": [
    {"before": "<weak generic resume line>", "after": "<strong tailored bullet aligned to JD with metrics where possible>"}
  ],
  "focus_guidance": ["<2-4 short, actionable next steps>", ...],
  "summary": "<one-sentence honest assessment, max 160 chars>"
}

Rules:
- If no resume is provided, set match_score=0, missing_skills=[], and base suggested_bullets on common resume gaps for this role (still 3-5 bullets).
- match_score = weighted overlap of required_skills (70%) and preferred_skills (30%) found in resume. Be honest, not generous.
- Return 5-10 items per skills list.
- Return 3-5 suggested_bullets, each with concrete tailored "after" text.
- Return 2-4 focus_guidance items.
- Output JSON ONLY."""


def extract_json(text: str) -> dict:
    """Robustly pull the first JSON object out of a model response."""
    text = text.strip()
    # strip markdown fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        pass
    # find first { ... last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end + 1])
    raise ValueError("Model did not return valid JSON")


@api_router.get("/")
async def root():
    return {"message": "Job Description Analyzer API"}


@api_router.post("/analyze", response_model=AnalysisResult)
async def analyze(req: AnalyzeRequest):
    if not req.job_description or len(req.job_description.strip()) < 30:
        raise HTTPException(status_code=400, detail="Job description is too short. Paste the full posting (at least 30 chars).")

    has_resume = bool(req.resume and req.resume.strip())

    user_text = f"""JOB DESCRIPTION:
\"\"\"
{req.job_description.strip()}
\"\"\"

RESUME:
\"\"\"
{req.resume.strip() if has_resume else "(none provided)"}
\"\"\"

Return the JSON now."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"analyze-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("openai", "gpt-5.2")

    try:
        response = await chat.send_message(UserMessage(text=user_text))
    except Exception as e:
        logger.exception("LLM error")
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")

    try:
        data = extract_json(response)
    except Exception as e:
        logger.error("JSON parse error: %s | raw: %s", e, response[:500])
        raise HTTPException(status_code=502, detail="AI returned malformed output. Please retry.")

    # Normalize / safeguard
    ks = data.get("key_skills") or {}
    result = AnalysisResult(
        job_title=str(data.get("job_title") or "Job Analysis")[:80],
        match_score=int(data.get("match_score") or 0) if has_resume else 0,
        key_skills=KeySkills(
            technical=list(ks.get("technical") or [])[:12],
            soft=list(ks.get("soft") or [])[:12],
            tools=list(ks.get("tools") or [])[:12],
        ),
        required_skills=list(data.get("required_skills") or [])[:15],
        preferred_skills=list(data.get("preferred_skills") or [])[:15],
        missing_skills=list(data.get("missing_skills") or [])[:15] if has_resume else [],
        suggested_bullets=[
            BulletSuggestion(before=str(b.get("before", ""))[:300], after=str(b.get("after", ""))[:400])
            for b in (data.get("suggested_bullets") or [])[:6]
            if isinstance(b, dict) and b.get("after")
        ],
        focus_guidance=list(data.get("focus_guidance") or [])[:5],
        summary=str(data.get("summary") or "")[:200],
        has_resume=has_resume,
    )

    # Persist (no _id leak)
    try:
        await db.analyses.insert_one(json.loads(result.model_dump_json()))
    except Exception:
        logger.exception("Failed to persist analysis")

    return result


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
