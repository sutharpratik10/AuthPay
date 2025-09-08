from __future__ import annotations
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import Tenant, NormalizedJob
from fetchers import VENDORS
from storage import store
from jobs_service import upsert_job, close_stale_jobs, purge_closed_older_than
from catalog import router as catalog_router
from selftest import run_self_tests
from utils import can_bind_uvicorn, run_coro_safely

# Initialize FastAPI app
app = FastAPI(
    title="Job Scraper API",
    description="API for scraping job postings from various ATS providers",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for your Next.js app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    vendor: Optional[str] = None
    token: Optional[str] = None
    company: Optional[str] = None
    enabled: Optional[bool] = None
    mark_stale_after_days: int = 7


@app.post("/scrape")
async def scrape(req: ScrapeRequest = Body(default=ScrapeRequest())):
    tq: Dict[str, Any] = {"enabled": True}
    if req.vendor: 
        tq["vendor"] = req.vendor
    if req.token: 
        tq["token"] = req.token
    
    tenants = [x async for x in store.tenants.find(tq)]
    if not tenants:
        raise HTTPException(404, detail="No tenants found for given criteria")
    
    totals = {"tenants": len(tenants), "fetched": 0, "inserted": 0, "updated": 0}
    
    for t in tenants:
        vendor = t["vendor"].lower()
        token = t["token"]
        company = t.get("company") or token
        
        if vendor not in VENDORS: 
            continue
            
        token_field, fetcher = VENDORS[vendor]
        arg = token if token_field == "token" else company
        
        try:
            jobs = await fetcher(arg)
        except HTTPException:
            raise
        except Exception as e:
            await store.tenants.update_one(
                {"vendor": t["vendor"], "token": t["token"]}, 
                {"$set": {"last_error": str(e), "last_scrape_at": datetime.now(timezone.utc)}}
            )
            continue
            
        totals["fetched"] += len(jobs)
        
        for job in jobs:
            job.company = company
            res = await upsert_job(job)
            totals["inserted"] += int(res["inserted"])
            totals["updated"] += int(res["updated"])
            
        await store.tenants.update_one(
            {"vendor": t["vendor"], "token": t["token"]}, 
            {"$set": {"last_scrape_at": datetime.now(timezone.utc), "last_count": len(jobs)}}
        )
    
    totals["closed_marked"] = await close_stale_jobs(req.mark_stale_after_days)
    return totals


@app.get("/jobs")
async def list_jobs(
    q: Optional[str] = Query(None), 
    vendor: Optional[str] = None, 
    company: Optional[str] = None, 
    status: Optional[str] = Query(None, pattern="^(open|closed)$"), 
    limit: int = Query(20, ge=1, le=200), 
    skip: int = Query(0, ge=0)
):
    query: Dict[str, Any] = {}
    if vendor: 
        query["vendor"] = vendor
    if company: 
        query["company"] = company
    if status: 
        query["status"] = status
    if q:
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [{"title": regex}, {"department": regex}, {"location_text": regex}]
    
    cursor = store.jobs.find(query, {"_id": 0}).sort("last_seen_at", -1).skip(skip).limit(limit)
    items = [x async for x in cursor]
    return {"count": len(items), "items": items}


@app.get("/jobs/{job_uid}")
async def get_job(job_uid: str):
    doc = await store.jobs.find_one({"job_uid": job_uid}, {"_id": 0})
    if not doc: 
        raise HTTPException(404, detail="Job not found")
    return doc


@app.delete("/jobs/closed/purge")
async def purge_closed(days: int = Query(180, ge=1, le=3650)):
    deleted = await purge_closed_older_than(days)
    return {"deleted": deleted}


@app.get("/__selftest")
async def selftest_endpoint():
    return await run_self_tests()


# Mount catalog router
app.include_router(catalog_router)


if __name__ == "__main__":
    if os.getenv("FORCE_UVICORN", "0") == "1" or can_bind_uvicorn():
        import uvicorn
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
    else:
        print("[safe-run] Restricted socket environment detected (no socket.SO_REUSEADDR). Skipping server startup.")
        print("[safe-run] Running self-tests instead. To run the API, use Docker or a full Python environment.")
        print(run_coro_safely(run_self_tests()))
