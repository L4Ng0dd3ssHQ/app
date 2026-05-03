import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://job-match-scanner.preview.emergentagent.com").rstrip("/")

JD = """We are hiring a Senior Software Engineer to build scalable backend services using Python, FastAPI, and MongoDB.
Required: 5+ years of Python experience, REST API design, AWS (ECS/Lambda), Docker, Kubernetes, CI/CD.
Preferred: GraphQL, Terraform, observability tooling (Datadog, Prometheus). Strong communication and mentorship skills required."""

RESUME = """John Doe — Software Engineer
- 6 years building Python services with Flask and FastAPI
- Designed REST APIs serving 1M+ requests/day, deployed on AWS ECS with Docker
- Led migration to MongoDB Atlas, reduced p95 latency by 40%
- Mentored 3 junior engineers; ran weekly tech talks
- Familiar with GitHub Actions and CircleCI"""


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# Health
def test_root(s):
    r = s.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()


# Analyze - too short
def test_analyze_too_short(s):
    r = s.post(f"{BASE_URL}/api/analyze", json={"job_description": "short"}, timeout=15)
    assert r.status_code == 400


# Analyze - JD only (no resume)
def test_analyze_no_resume(s):
    r = s.post(f"{BASE_URL}/api/analyze", json={"job_description": JD, "resume": ""}, timeout=120)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["has_resume"] is False
    assert d["match_score"] == 0
    assert d["missing_skills"] == []
    assert "_id" not in d
    assert isinstance(d["job_title"], str) and len(d["job_title"]) > 0
    assert "key_skills" in d and "technical" in d["key_skills"]
    assert isinstance(d["suggested_bullets"], list)
    assert isinstance(d["focus_guidance"], list)


# Analyze - JD + Resume
def test_analyze_with_resume(s):
    r = s.post(f"{BASE_URL}/api/analyze", json={"job_description": JD, "resume": RESUME}, timeout=120)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["has_resume"] is True
    assert 0 <= d["match_score"] <= 100
    assert "_id" not in d
    assert isinstance(d["required_skills"], list) and len(d["required_skills"]) > 0
    assert isinstance(d["preferred_skills"], list)
    assert isinstance(d["missing_skills"], list)
    assert len(d["suggested_bullets"]) >= 1
    for b in d["suggested_bullets"]:
        assert "before" in b and "after" in b
    assert 2 <= len(d["focus_guidance"]) <= 5
