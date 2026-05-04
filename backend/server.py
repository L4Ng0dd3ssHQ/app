from fastapi import FastAPI, APIRouter, HTTPException, Request
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
from datetime import datetime, timezone, timedelta


from openai import OpenAI
import stripe as stripe_sdk


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')


# Server-defined Pro packages (NEVER trust amount from frontend)
PRO_PACKAGES = {
    "pro_monthly": {"amount": 7.00, "currency": "usd", "label": "LandIt Pro · 30-day pass"},
}
PRO_DURATION_DAYS = 30


app = FastAPI()
api_router = APIRouter(prefix="/api")


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)




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
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end + 1])
    raise ValueError("Model did not return valid JSON")




@api_router.get("/")
async def root():
    return {"message": "LandIt API"}




@api_router.post("/analyze", response_model=AnalysisResult)
async def analyze(req: AnalyzeRequest):
    if not req.job_description or len(req.job_description.strip()) < 30:
        raise HTTPException(status_code=400, detail="Job description is too short.")


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


    try:
        ai_client = OpenAI()
        response = ai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_text}
            ]
        )
        data = extract_json(response.choices[0].message.content)
    except Exception as e:
        logger.exception("LLM error")
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")


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


    try:
        await db.analyses.insert_one(json.loads(result.model_dump_json()))
    except Exception:
        logger.exception("Failed to persist analysis")


    return result




# ===== Stripe / LandIt Pro =====


class CheckoutCreateRequest(BaseModel):
    package_id: str
    origin_url: str
    device_id: str




class CheckoutCreateResponse(BaseModel):
    url: str
    session_id: str




@api_router.post("/checkout", response_model=CheckoutCreateResponse)
async def create_checkout(req: CheckoutCreateRequest, http_request: Request):
    if req.package_id not in PRO_PACKAGES:
        raise HTTPException(status_code=400, detail="Unknown package")
    if not req.origin_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid origin_url")
    if not req.device_id or len(req.device_id) > 64:
        raise HTTPException(status_code=400, detail="Invalid device_id")


    pkg = PRO_PACKAGES[req.package_id]
    stripe_sdk.api_key = STRIPE_API_KEY


    success_url = f"{req.origin_url}/pro/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/pro"


    try:
        session = stripe_sdk.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": pkg["currency"],
                    "product_data": {"name": pkg["label"]},
                    "unit_amount": int(pkg["amount"] * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "package_id": req.package_id,
                "device_id": req.device_id,
                "product": "landit_pro",
            },
        )
    except Exception as e:
        logger.exception("Stripe checkout error")
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")


    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "device_id": req.device_id,
        "package_id": req.package_id,
        "amount": float(pkg["amount"]),
        "currency": pkg["currency"],
        "payment_status": "initiated",
        "status": "open",
        "fulfilled": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })


    return CheckoutCreateResponse(url=session.url, session_id=session.id)




class CheckoutStatusOut(BaseModel):
    session_id: str
    status: str
    payment_status: str
    fulfilled: bool
    pro_until: Optional[str] = None




@api_router.get("/checkout/status/{session_id}", response_model=CheckoutStatusOut)
async def checkout_status(session_id: str):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Unknown session")


    stripe_sdk.api_key = STRIPE_API_KEY
    try:
        session = stripe_sdk.checkout.Session.retrieve(session_id)
    except Exception as e:
        logger.exception("checkout status failed")
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}")


    s_status = getattr(session, "status", "open")
    s_payment_status = getattr(session, "payment_status", "unpaid")


    pro_until = txn.get("pro_until")
    fulfilled = bool(txn.get("fulfilled"))


    if s_payment_status == "paid" and not fulfilled:
        pro_until_dt = datetime.now(timezone.utc) + timedelta(days=PRO_DURATION_DAYS)
        pro_until = pro_until_dt.isoformat()
        await db.payment_transactions.update_one(
            {"session_id": session_id, "fulfilled": {"$ne": True}},
            {"$set": {
                "payment_status": s_payment_status,
                "status": s_status,
                "fulfilled": True,
                "pro_until": pro_until,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        device_id = txn.get("device_id")
        if device_id:
            await db.pro_devices.update_one(
                {"device_id": device_id},
                {"$set": {"device_id": device_id, "pro_until": pro_until,
                          "updated_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
        fulfilled = True


    return CheckoutStatusOut(
        session_id=session_id,
        status=s_status,
        payment_status=s_payment_status,
        fulfilled=fulfilled,
        pro_until=pro_until,
    )




@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


    stripe_sdk.api_key = STRIPE_API_KEY
    try:
        event = stripe_sdk.Webhook.construct_event(body, sig, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")


    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("payment_status") == "paid":
            session_id = session["id"]
            txn = await db.payment_transactions.find_one({"session_id": session_id})
            if txn and not txn.get("fulfilled"):
                pro_until = (datetime.now(timezone.utc) + timedelta(days=PRO_DURATION_DAYS)).isoformat()
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "fulfilled": {"$ne": True}},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "complete",
                        "fulfilled": True,
                        "pro_until": pro_until,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                device_id = txn.get("device_id")
                if device_id:
                    await db.pro_devices.update_one(
                        {"device_id": device_id},
                        {"$set": {"device_id": device_id, "pro_until": pro_until,
                                  "updated_at": datetime.now(timezone.utc).isoformat()}},
                        upsert=True,
                    )
    return {"received": True}




@api_router.get("/pro/{device_id}")
async def get_pro_status(device_id: str):
    doc = await db.pro_devices.find_one({"device_id": device_id}, {"_id": 0})
    if not doc:
        return {"is_pro": False, "pro_until": None}
    pro_until = doc.get("pro_until")
    is_pro = False
    if pro_until:
        try:
            is_pro = datetime.fromisoformat(pro_until) > datetime.now(timezone.utc)
        except Exception:
            is_pro = False
    return {"is_pro": is_pro, "pro_until": pro_until}

# ===== Saved Resumes (Pro feature) =====

async def _device_is_pro(device_id: str) -> bool:
    doc = await db.pro_devices.find_one({"device_id": device_id}, {"_id": 0, "pro_until": 1})
    if not doc or not doc.get("pro_until"):
        return False
    try:
        return datetime.fromisoformat(doc["pro_until"]) > datetime.now(timezone.utc)
    except Exception:
        return False


def _validate_device_id(device_id: str) -> str:
    if not device_id or len(device_id) > 64 or len(device_id) < 8:
        raise HTTPException(status_code=400, detail="Invalid device_id")
    return device_id


class SavedResume(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    label: str
    content: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ResumeCreateRequest(BaseModel):
    device_id: str
    label: str
    content: str


class ResumeUpdateRequest(BaseModel):
    device_id: str
    label: Optional[str] = None
    content: Optional[str] = None


MAX_RESUMES = 25
MAX_RESUME_CHARS = 50000
MAX_LABEL_CHARS = 80


@api_router.post("/resumes", response_model=SavedResume)
async def create_resume(req: ResumeCreateRequest):
    _validate_device_id(req.device_id)
    if not await _device_is_pro(req.device_id):
        raise HTTPException(status_code=403, detail="Saved resumes are a Pro feature.")
    label = (req.label or "").strip()[:MAX_LABEL_CHARS]
    content = (req.content or "").strip()[:MAX_RESUME_CHARS]
    if not label:
        raise HTTPException(status_code=400, detail="Label is required.")
    if len(content) < 30:
        raise HTTPException(status_code=400, detail="Resume is too short (min 30 chars).")

    count = await db.resumes.count_documents({"device_id": req.device_id})
    if count >= MAX_RESUMES:
        raise HTTPException(status_code=400, detail=f"Resume limit reached ({MAX_RESUMES}). Delete one to add another.")

    resume = SavedResume(device_id=req.device_id, label=label, content=content)
    await db.resumes.insert_one(json.loads(resume.model_dump_json()))
    return resume


@api_router.get("/resumes/{device_id}", response_model=List[SavedResume])
async def list_resumes(device_id: str):
    _validate_device_id(device_id)
    if not await _device_is_pro(device_id):
        raise HTTPException(status_code=403, detail="Saved resumes are a Pro feature.")
    cursor = db.resumes.find({"device_id": device_id}, {"_id": 0}).sort("updated_at", -1)
    docs = await cursor.to_list(length=MAX_RESUMES)
    return [SavedResume(**d) for d in docs]


@api_router.put("/resumes/{resume_id}", response_model=SavedResume)
async def update_resume(resume_id: str, req: ResumeUpdateRequest):
    _validate_device_id(req.device_id)
    if not await _device_is_pro(req.device_id):
        raise HTTPException(status_code=403, detail="Saved resumes are a Pro feature.")

    existing = await db.resumes.find_one({"id": resume_id, "device_id": req.device_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Resume not found.")

    update: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if req.label is not None:
        label = req.label.strip()[:MAX_LABEL_CHARS]
        if not label:
            raise HTTPException(status_code=400, detail="Label cannot be empty.")
        update["label"] = label
    if req.content is not None:
        content = req.content.strip()[:MAX_RESUME_CHARS]
        if len(content) < 30:
            raise HTTPException(status_code=400, detail="Resume is too short (min 30 chars).")
        update["content"] = content

    await db.resumes.update_one(
        {"id": resume_id, "device_id": req.device_id},
        {"$set": update},
    )
    doc = await db.resumes.find_one({"id": resume_id, "device_id": req.device_id}, {"_id": 0})
    return SavedResume(**doc)


@api_router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str, device_id: str):
    _validate_device_id(device_id)
    if not await _device_is_pro(device_id):
        raise HTTPException(status_code=403, detail="Saved resumes are a Pro feature.")
    res = await db.resumes.delete_one({"id": resume_id, "device_id": device_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return {"deleted": True}


# ===== Dev-only helpers (gated by LANDIT_DEV_MODE env var) =====

LANDIT_DEV_MODE = os.environ.get("LANDIT_DEV_MODE", "").lower() in ("1", "true", "yes")


class DevPromoteRequest(BaseModel):
    device_id: str
    days: int = 30


@api_router.post("/dev/promote-to-pro")
async def dev_promote_to_pro(req: DevPromoteRequest):
    """Dev-only: instantly mark a device as Pro for `days` days. Disabled in prod."""
    if not LANDIT_DEV_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    _validate_device_id(req.device_id)
    days = max(1, min(int(req.days or 30), 365))
    pro_until = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    await db.pro_devices.update_one(
        {"device_id": req.device_id},
        {"$set": {
            "device_id": req.device_id,
            "pro_until": pro_until,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": "dev_promote",
        }},
        upsert=True,
    )
    return {"is_pro": True, "pro_until": pro_until, "device_id": req.device_id}


@api_router.post("/dev/revoke-pro")
async def dev_revoke_pro(req: DevPromoteRequest):
    """Dev-only: remove Pro from a device."""
    if not LANDIT_DEV_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    _validate_device_id(req.device_id)
    await db.pro_devices.delete_one({"device_id": req.device_id})
    return {"is_pro": False, "device_id": req.device_id}


@api_router.get("/dev/status")
async def dev_status():
    """Tells the frontend whether the dev panel should be exposed."""
    return {"dev_mode": LANDIT_DEV_MODE}



app.include_router(api_router)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
