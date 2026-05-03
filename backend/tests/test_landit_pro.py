"""Pytest suite for LandIt Pro: checkout, status, webhook, pro device."""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://job-match-scanner.preview.emergentagent.com",
).rstrip("/")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# Root API health
def test_root(s):
    r = s.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("message") == "LandIt API"


# Analyze regression - too short
def test_analyze_too_short(s):
    r = s.post(f"{BASE_URL}/api/analyze", json={"job_description": "short"}, timeout=15)
    assert r.status_code == 400


# ===== Checkout =====
def test_checkout_unknown_package(s):
    r = s.post(
        f"{BASE_URL}/api/checkout",
        json={"package_id": "junk", "origin_url": "https://example.com", "device_id": "TEST_dev_1"},
        timeout=20,
    )
    assert r.status_code == 400


def test_checkout_invalid_origin(s):
    r = s.post(
        f"{BASE_URL}/api/checkout",
        json={"package_id": "pro_monthly", "origin_url": "ftp://bad", "device_id": "TEST_dev_2"},
        timeout=20,
    )
    assert r.status_code == 400


def test_checkout_empty_device_id(s):
    r = s.post(
        f"{BASE_URL}/api/checkout",
        json={"package_id": "pro_monthly", "origin_url": "https://example.com", "device_id": ""},
        timeout=20,
    )
    assert r.status_code == 400


def test_checkout_too_long_device_id(s):
    r = s.post(
        f"{BASE_URL}/api/checkout",
        json={
            "package_id": "pro_monthly",
            "origin_url": "https://example.com",
            "device_id": "X" * 200,
        },
        timeout=20,
    )
    assert r.status_code == 400


def test_checkout_success_returns_stripe_url(s):
    payload = {
        "package_id": "pro_monthly",
        "origin_url": "https://job-match-scanner.preview.emergentagent.com",
        "device_id": "TEST_dev_pytest_001",
    }
    r = s.post(f"{BASE_URL}/api/checkout", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "url" in d and "session_id" in d
    assert d["url"].startswith("https://checkout.stripe.com/")
    assert d["session_id"].startswith("cs_")
    # store for subsequent test
    pytest.checkout_session_id = d["session_id"]


# ===== Checkout status =====
def test_checkout_status_unknown_session(s):
    r = s.get(f"{BASE_URL}/api/checkout/status/cs_does_not_exist_xyz", timeout=15)
    assert r.status_code == 404


def test_checkout_status_existing_session(s):
    sid = getattr(pytest, "checkout_session_id", None)
    if not sid:
        pytest.skip("no session created")
    r = s.get(f"{BASE_URL}/api/checkout/status/{sid}", timeout=20)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("session_id", "status", "payment_status", "fulfilled"):
        assert k in d
    # Not paid yet -> not fulfilled
    assert d["fulfilled"] is False
    assert d["payment_status"] in ("unpaid", "no_payment_required", "open", "initiated")
    # _id should never leak
    assert "_id" not in d


# ===== Webhook =====
def test_webhook_route_exists(s):
    # Will likely fail signature verification, that's OK; we just want the route
    r = s.post(
        f"{BASE_URL}/api/webhook/stripe",
        data=b"{}",
        headers={"Stripe-Signature": "t=0,v1=invalid", "Content-Type": "application/json"},
        timeout=15,
    )
    # Either 200 received:true OR 400 signature error - both prove the route exists
    assert r.status_code in (200, 400)
    if r.status_code == 200:
        assert r.json().get("received") is True


# ===== Pro device =====
def test_pro_status_unknown_device(s):
    r = s.get(f"{BASE_URL}/api/pro/TEST_unknown_device_xyz", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d == {"is_pro": False, "pro_until": None}
