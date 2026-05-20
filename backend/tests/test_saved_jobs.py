import asyncio
import sys
from types import SimpleNamespace
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class FakeCursor:
    def __init__(self, docs):
        self.docs = [dict(doc) for doc in docs]

    def sort(self, field, direction):
        reverse = direction < 0
        self.docs.sort(key=lambda doc: doc.get(field, ""), reverse=reverse)
        return self

    async def to_list(self, length=None):
        return self.docs[:length]


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = docs or []

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return {k: v for k, v in doc.items() if k != "_id"}
        return None

    async def insert_one(self, doc):
        self.docs.append(dict(doc))
        return SimpleNamespace(inserted_id=len(self.docs))

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                doc.update(update.get("$set", {}))
                return SimpleNamespace(matched_count=1, modified_count=1)
        if upsert:
            new_doc = dict(query)
            new_doc.update(update.get("$set", {}))
            self.docs.append(new_doc)
            return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=len(self.docs))
        return SimpleNamespace(matched_count=0, modified_count=0)

    async def delete_one(self, query):
        before = len(self.docs)
        self.docs = [doc for doc in self.docs if not all(doc.get(k) == v for k, v in query.items())]
        return SimpleNamespace(deleted_count=before - len(self.docs))

    async def count_documents(self, query):
        return sum(1 for doc in self.docs if all(doc.get(k) == v for k, v in query.items()))

    def find(self, query, projection=None):
        return FakeCursor([doc for doc in self.docs if all(doc.get(k) == v for k, v in query.items())])


def run(coro):
    return asyncio.run(coro)


def make_request(device_id="device-test-123", title="Software Engineer Analyst - AI Trainer"):
    return server.SavedJobCreateRequest(
        device_id=device_id,
        source="Placeholder listing",
        source_id="ai-trainer",
        sourceUrl="https://example.com/jobs/ai-trainer",
        title=title,
        company="DataAnnotation",
        location="Remote",
        salary="$50 - $100 an hour",
        employmentType="Contract",
        remoteType="Remote",
        schedule="Flexible schedule",
        postedAt="Today",
        shortDescription="Review AI-generated code.",
        description="Review AI-generated code and write clear feedback.",
        applyUrl="https://example.com/jobs/ai-trainer/apply",
    )


def test_saved_job_crud_for_pro_device(monkeypatch):
    fake_db = SimpleNamespace(saved_jobs=FakeCollection())
    monkeypatch.setattr(server, "db", fake_db)
    monkeypatch.setattr(server, "_device_is_pro", lambda device_id: asyncio.sleep(0, result=True))

    created = run(server.create_saved_job(make_request()))
    assert created.title == "Software Engineer Analyst - AI Trainer"
    assert created.status == "saved"

    listed = run(server.list_saved_jobs("device-test-123"))
    assert len(listed) == 1

    updated = run(server.update_saved_job(created.id, server.SavedJobUpdateRequest(
        device_id="device-test-123",
        status="applied",
        notes="Applied on company site",
        applied_at="2026-05-16",
    )))
    assert updated.status == "applied"
    assert updated.notes == "Applied on company site"

    deleted = run(server.delete_saved_job(created.id, "device-test-123"))
    assert deleted == {"deleted": True}
    assert run(server.list_saved_jobs("device-test-123")) == []


def test_saved_job_requires_pro(monkeypatch):
    monkeypatch.setattr(server, "db", SimpleNamespace(saved_jobs=FakeCollection()))
    monkeypatch.setattr(server, "_device_is_pro", lambda device_id: asyncio.sleep(0, result=False))

    with pytest.raises(HTTPException) as exc:
        run(server.create_saved_job(make_request()))

    assert exc.value.status_code == 403


def test_saved_job_duplicate_updates_existing(monkeypatch):
    fake_db = SimpleNamespace(saved_jobs=FakeCollection())
    monkeypatch.setattr(server, "db", fake_db)
    monkeypatch.setattr(server, "_device_is_pro", lambda device_id: asyncio.sleep(0, result=True))

    first = run(server.create_saved_job(make_request()))
    second = run(server.create_saved_job(make_request(title="Updated Job Title")))

    assert second.id == first.id
    assert second.title == "Updated Job Title"
    assert run(server.list_saved_jobs("device-test-123"))[0].title == "Updated Job Title"
