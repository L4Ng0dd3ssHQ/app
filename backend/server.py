from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
import hmac
import hashlib
import secrets
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
    "pro_weekly": {
        "amount": 7.00,
        "currency": "usd",
        "label": "LandIt Pro - 7-day pass",
        "duration_days": 7,
        "stripe_product_id": "prod_US7E2SV4GUrpAh",
    },
    "pro_monthly": {
        "amount": 19.00,
        "currency": "usd",
        "label": "LandIt Pro - 30-day pass",
        "duration_days": 30,
        "stripe_product_id": "prod_UWX8p62MFivHEF",
    },
}
RESTORE_CODE_DEVICE_LIMIT = 3
RESTORE_CODE_SECRET = os.environ.get("RESTORE_CODE_SECRET") or STRIPE_API_KEY or os.environ["DB_NAME"]


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


def _normalize_restore_code(code: str) -> str:
    compact = re.sub(r"[^A-Za-z0-9]", "", code or "").upper()
    if compact.startswith("LANDIT"):
        compact = compact[6:]
    if len(compact) != 8:
        raise HTTPException(status_code=400, detail="Enter a valid restore code.")
    return f"LANDIT-{compact[:4]}-{compact[4:]}"


def _restore_code_hash(code: str) -> str:
    normalized = _normalize_restore_code(code)
    return hmac.new(
        RESTORE_CODE_SECRET.encode("utf-8"),
        normalized.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _generate_restore_code() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    raw = "".join(secrets.choice(alphabet) for _ in range(8))
    return f"LANDIT-{raw[:4]}-{raw[4:]}"


def _package_duration_days(package_id: Optional[str]) -> int:
    package = PRO_PACKAGES.get(package_id or "")
    if not package:
        return 7
    return int(package.get("duration_days") or 7)


async def _grant_pro_device(device_id: str, pro_until: str, source: str = "checkout") -> None:
    await db.pro_devices.update_one(
        {"device_id": device_id},
        {"$set": {
            "device_id": device_id,
            "pro_until": pro_until,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": source,
        }},
        upsert=True,
    )


async def _create_restore_code_for_checkout(session_id: str, device_id: Optional[str], pro_until: Optional[str]) -> Optional[str]:
    if not device_id or not pro_until:
        return None

    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0, "restore_code_hash": 1})
    if txn and txn.get("restore_code_hash"):
        return None

    for _ in range(5):
        restore_code = _generate_restore_code()
        code_hash = _restore_code_hash(restore_code)
        existing = await db.pro_restore_codes.find_one({"code_hash": code_hash}, {"_id": 1})
        if existing:
            continue

        now = datetime.now(timezone.utc).isoformat()
        await db.pro_restore_codes.insert_one({
            "code_hash": code_hash,
            "session_id": session_id,
            "pro_until": pro_until,
            "device_ids": [device_id],
            "device_limit": RESTORE_CODE_DEVICE_LIMIT,
            "created_at": now,
            "updated_at": now,
        })
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"restore_code_hash": code_hash, "updated_at": now}},
        )
        return restore_code

    logger.error("Failed to generate unique restore code")
    return None




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
            allow_promotion_codes=True,
            line_items=[{
                "price_data": {
                    "currency": pkg["currency"],
                    "product": pkg["stripe_product_id"],
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
        "duration_days": int(pkg["duration_days"]),
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
    restore_code: Optional[str] = None




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
    restore_code = None


    if s_payment_status == "paid" and not fulfilled:
        duration_days = int(txn.get("duration_days") or _package_duration_days(txn.get("package_id")))
        pro_until_dt = datetime.now(timezone.utc) + timedelta(days=duration_days)
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
            await _grant_pro_device(device_id, pro_until, "checkout")
            restore_code = await _create_restore_code_for_checkout(session_id, device_id, pro_until)
        fulfilled = True
    elif fulfilled and pro_until and not txn.get("restore_code_hash"):
        restore_code = await _create_restore_code_for_checkout(session_id, txn.get("device_id"), pro_until)


    return CheckoutStatusOut(
        session_id=session_id,
        status=s_status,
        payment_status=s_payment_status,
        fulfilled=fulfilled,
        pro_until=pro_until,
        restore_code=restore_code,
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
                duration_days = int(txn.get("duration_days") or _package_duration_days(txn.get("package_id")))
                pro_until = (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat()
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
                    await _grant_pro_device(device_id, pro_until, "stripe_webhook")
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


class ProRestoreRequest(BaseModel):
    restore_code: str
    device_id: str


class ProRestoreResponse(BaseModel):
    is_pro: bool
    pro_until: str
    devices_used: int
    device_limit: int


@api_router.post("/pro/restore", response_model=ProRestoreResponse)
async def restore_pro(req: ProRestoreRequest):
    _validate_device_id(req.device_id)
    code_hash = _restore_code_hash(req.restore_code)
    doc = await db.pro_restore_codes.find_one({"code_hash": code_hash}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=400, detail="Restore code not found. Check the code and try again.")

    pro_until = doc.get("pro_until")
    try:
        expires_at = datetime.fromisoformat(pro_until)
    except Exception:
        raise HTTPException(status_code=400, detail="This restore code is invalid.")
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="This restore code has expired.")

    device_ids = list(doc.get("device_ids") or [])
    device_limit = int(doc.get("device_limit") or RESTORE_CODE_DEVICE_LIMIT)
    if req.device_id not in device_ids:
        if len(device_ids) >= device_limit:
            raise HTTPException(status_code=403, detail=f"This restore code has already been used on {device_limit} devices.")
        device_ids.append(req.device_id)
        await db.pro_restore_codes.update_one(
            {"code_hash": code_hash},
            {"$set": {"device_ids": device_ids, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )

    await _grant_pro_device(req.device_id, pro_until, "restore_code")
    return ProRestoreResponse(
        is_pro=True,
        pro_until=pro_until,
        devices_used=len(device_ids),
        device_limit=device_limit,
    )

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
