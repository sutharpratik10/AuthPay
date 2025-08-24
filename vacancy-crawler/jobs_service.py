from __future__ import annotations
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any, Dict


from models import NormalizedJob
from storage import store, get_mongo_db


async def ensure_jobs_indexes() -> None:
await store.jobs.create_index("job_uid", unique=True)
await store.jobs.create_index([("last_seen_at", -1)])
await store.tenants.create_index([("vendor", 1), ("token", 1)], unique=True)


async def upsert_job(job: NormalizedJob) -> Dict[str, Any]:
now = datetime.now(timezone.utc)
job.first_seen_at = job.first_seen_at or now
job.last_seen_at = now
canonical = {k: v for k, v in job.model_dump().items() if k not in {"first_seen_at","last_seen_at","status","content_hash"}}
job.content_hash = hashlib.sha256(str(canonical).encode("utf-8")).hexdigest()
existing = await store.jobs.find_one({"job_uid": job.job_uid})
if not existing:
await store.jobs.insert_one(job.model_dump()); return {"inserted": True, "updated": False}
if existing.get("content_hash") != job.content_hash:
diff = {"old": {k: existing.get(k) for k in canonical.keys()}, "new": canonical}
mongo = get_mongo_db()
if mongo is not None: # history only when Mongo exists
await mongo.jobs_history.insert_one({"job_uid": job.job_uid, "changed_at": now, "diff": diff})
await store.jobs.update_one({"job_uid": job.job_uid}, {"$set": {**job.model_dump()}})
return {"inserted": False, "updated": True}
await store.jobs.update_one({"job_uid": job.job_uid}, {"$set": {"last_seen_at": now, "status": "open"}})
return {"inserted": False, "updated": False}


async def close_stale_jobs(days: int = 7) -> int:
cutoff = datetime.now(timezone.utc) - timedelta(days=days)
res = await store.jobs.update_many({"status": "open", "last_seen_at": {"$lt": cutoff}}, {"$set": {"status": "closed"}})
return getattr(res, "modified_count", 0)


async def purge_closed_older_than(days: int = 180) -> int:
cutoff = datetime.now(timezone.utc) - timedelta(days=days)
res = await store.jobs.delete_many({"status": "closed", "last_seen_at": {"$lt": cutoff}})
return getattr(res, "deleted_count", 0)