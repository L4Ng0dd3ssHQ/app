import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import server


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = docs or []

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return dict(doc)
        return None

    async def insert_one(self, doc):
        self.docs.append(dict(doc))
        return SimpleNamespace(inserted_id=len(self.docs))

    async def update_one(self, query, update, upsert=False):
        doc = await self.find_one(query)
        if doc:
            target = self.docs[self.docs.index(next(d for d in self.docs if all(d.get(k) == v for k, v in query.items())))]
            target.update(update.get("$set", {}))
            return SimpleNamespace(matched_count=1, modified_count=1)
        if upsert:
            new_doc = dict(query)
            new_doc.update(update.get("$set", {}))
            self.docs.append(new_doc)
            return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=len(self.docs))
        return SimpleNamespace(matched_count=0, modified_count=0)


def run(coro):
    return asyncio.run(coro)


def fake_db_for_code(code, pro_until, devices=None):
    return SimpleNamespace(
        pro_restore_codes=FakeCollection([{
            "code_hash": server._restore_code_hash(code),
            "session_id": "cs_test_restore",
            "pro_until": pro_until,
            "device_ids": devices or ["device-a"],
            "device_limit": 3,
        }]),
        pro_devices=FakeCollection(),
    )


def test_restore_invalid_code_rejected(monkeypatch):
    monkeypatch.setattr(server, "db", SimpleNamespace(pro_restore_codes=FakeCollection(), pro_devices=FakeCollection()))

    with pytest.raises(HTTPException) as exc:
        run(server.restore_pro(server.ProRestoreRequest(restore_code="LANDIT-NOPE-1234", device_id="device-new")))

    assert exc.value.status_code == 400


def test_restore_expired_code_rejected(monkeypatch):
    code = "LANDIT-ABCD-1234"
    expired = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    monkeypatch.setattr(server, "db", fake_db_for_code(code, expired))

    with pytest.raises(HTTPException) as exc:
        run(server.restore_pro(server.ProRestoreRequest(restore_code=code, device_id="device-new")))

    assert exc.value.status_code == 403


def test_restore_valid_code_grants_new_device(monkeypatch):
    code = "LANDIT-ABCD-1234"
    pro_until = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    fake_db = fake_db_for_code(code, pro_until)
    monkeypatch.setattr(server, "db", fake_db)

    result = run(server.restore_pro(server.ProRestoreRequest(restore_code=code, device_id="device-b")))

    assert result.is_pro is True
    assert result.pro_until == pro_until
    assert result.devices_used == 2
    assert fake_db.pro_restore_codes.docs[0]["device_ids"] == ["device-a", "device-b"]
    assert fake_db.pro_devices.docs[0]["device_id"] == "device-b"


def test_restore_same_device_does_not_consume_slot(monkeypatch):
    code = "LANDIT-ABCD-1234"
    pro_until = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    fake_db = fake_db_for_code(code, pro_until, ["device-a", "device-b"])
    monkeypatch.setattr(server, "db", fake_db)

    result = run(server.restore_pro(server.ProRestoreRequest(restore_code=code, device_id="device-b")))

    assert result.devices_used == 2
    assert fake_db.pro_restore_codes.docs[0]["device_ids"] == ["device-a", "device-b"]


def test_restore_fourth_device_rejected(monkeypatch):
    code = "LANDIT-ABCD-1234"
    pro_until = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    monkeypatch.setattr(server, "db", fake_db_for_code(code, pro_until, ["device-a", "device-b", "device-c"]))

    with pytest.raises(HTTPException) as exc:
        run(server.restore_pro(server.ProRestoreRequest(restore_code=code, device_id="device-d")))

    assert exc.value.status_code == 403
