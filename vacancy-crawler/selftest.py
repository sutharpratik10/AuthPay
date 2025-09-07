from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import httpx


from models import NormalizedJob
from utils import deterministic_job_uid, normalize_ts, make_client
from storage import store
from fetchers import fetch_greenhouse, fetch_lever
from jobs_service import upsert_job, close_stale_jobs, purge_closed_older_than


async def run_self_tests() -> Dict[str, Any]:
    results: Dict[str, Any] = {"tests": []}
    # UID
    uid1 = deterministic_job_uid("vendor","token","123"); uid2 = deterministic_job_uid("vendor","token","123")
    results["tests"].append({"name":"uid_stable","ok": uid1 == uid2})
    # TS normalize
    ts = normalize_ts(1_700_000_000_000); ts_iso = normalize_ts("2024-01-01T00:00:00Z")
    results["tests"].append({"name":"normalize_ts_ms","ok": isinstance(ts, datetime)})
    results["tests"].append({"name":"normalize_ts_iso","ok": isinstance(ts_iso, datetime)})
    # Greenhouse mock
    gh_payload = {"jobs": [{"id":111,"title":"Backend Engineer","location":{"name":"Remote - India"},
    "departments":[{"name":"Engineering"}],"updated_at":"2024-01-01T00:00:00Z",
    "absolute_url":"https://boards.greenhouse.io/acme/jobs/111","content":"<p>Build APIs</p>",
    "metadata":[{"name":"Level","value":"Senior"}]}]}
    def gh_handler(request: httpx.Request) -> httpx.Response:
        assert request.url.host == "boards-api.greenhouse.io"; return httpx.Response(200, json=gh_payload)
    jobs_gh = await fetch_greenhouse("acme", get_client=lambda: make_client(httpx.MockTransport(gh_handler)))
    results["tests"].append({"name":"fetch_greenhouse_mock","ok": len(jobs_gh)==1 and jobs_gh[0].vendor=="greenhouse"})
    # Lever mock
    lever_payload = [{"_id":"abc123","text":"Data Analyst","categories":{"team":"Analytics","location":"Remote","commitment":"Full-time"},
    "createdAt":1_700_000_000_000,"updatedAt":1_700_000_500_000,
    "hostedUrl":"https://jobs.lever.co/acme/abc123","description":"<p>Analyze data</p>","tags":["SQL","Python"]}]
    def lever_handler(request: httpx.Request) -> httpx.Response:
        assert request.url.host == "api.lever.co"; return httpx.Response(200, json=lever_payload)
    jobs_lv = await fetch_lever("acme", get_client=lambda: make_client(httpx.MockTransport(lever_handler)))
    results["tests"].append({"name":"fetch_lever_mock","ok": len(jobs_lv)==1 and jobs_lv[0].vendor=="lever"})
    # Upsert + idempotency
    if jobs_gh:
        r1 = await upsert_job(jobs_gh[0]); r2 = await upsert_job(jobs_gh[0])
        results["tests"].append({"name":"upsert_insert_then_touch","ok": r1.get("inserted") is True and r2.get("inserted") is False})
    # Regex search
    sample = NormalizedJob(job_uid=deterministic_job_uid("lever","acme","xyz"), company="Acme", vendor="lever", external_job_id="xyz", title="Senior SQL Developer", apply_url="https://jobs.lever.co/acme/xyz")
    await upsert_job(sample)
    cursor = store.jobs.find({"$or":[{"title":{"$regex":"sql","$options":"i"}}]}, {"_id":0})
    found = [x async for x in cursor]
    results["tests"].append({"name":"regex_search_title","ok": any("SQL Developer" in (doc.get("title") or "") for doc in found)})
    # Retention
    old_time = datetime.now(timezone.utc) - timedelta(days=30)
    await store.jobs.update_one({"job_uid": sample.job_uid}, {"$set": {"last_seen_at": old_time}})
    closed = await close_stale_jobs(7); purged = await purge_closed_older_than(14)
    results["tests"].append({"name":"close_and_purge","ok": isinstance(closed,int) and isinstance(purged,int)})
    return results