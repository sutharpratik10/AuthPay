from __future__ import annotations
import re
from typing import Any, Callable, Dict, List, Tuple
from fastapi import HTTPException


from models import NormalizedJob
from utils import normalize_ts, make_client, deterministic_job_uid


Fetcher = Tuple[str, Callable[..., Any]]


async def fetch_greenhouse(token: str, *, get_client=make_client) -> List[NormalizedJob]:
import httpx
url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"
async with get_client() as s:
r = await s.get(url)
if r.status_code != 200:
raise HTTPException(status_code=502, detail=f"Greenhouse fetch failed: {r.status_code}")
data = r.json()
jobs: List[NormalizedJob] = []
for j in data.get("jobs", []):
ext_id = str(j.get("id"))
job_uid = deterministic_job_uid("greenhouse", token, ext_id)
loc_name = (j.get("location") or {}).get("name")
dept = (j.get("departments") or [{}])[0].get("name") if j.get("departments") else None
tags: List[str] = []
for m in j.get("metadata", []) or []:
n, v = m.get("name"), m.get("value")
if n and v: tags.append(f"{n}:{v}")
jobs.append(NormalizedJob(
job_uid=job_uid, company=token, vendor="greenhouse", external_job_id=ext_id,
title=j.get("title") or "", department=dept, location_text=loc_name,
remote=bool(re.search(r"remote", loc_name or "", re.I)), work_type=None,
posted_at=normalize_ts(j.get("updated_at") or j.get("created_at")),
updated_at=normalize_ts(j.get("updated_at")), apply_url=j.get("absolute_url") or "",
description_html=j.get("content") or None, tags=tags or None,
))
return jobs


async def fetch_lever(company: str, *, get_client=make_client) -> List[NormalizedJob]:
import httpx
url = f"https://api.lever.co/v0/postings/{company}?mode=json"
async with get_client() as s:
r = await s.get(url)
if r.status_code != 200:
raise HTTPException(status_code=502, detail=f"Lever fetch failed: {r.status_code}")
data = r.json()
jobs: List[NormalizedJob] = []
for j in data or []:
ext_id = str(j.get("_id") or j.get("id") or j.get("hostedUrl") or "")
loc = (j.get("categories") or {}).get("location")
jobs.append(NormalizedJob(
job_uid=deterministic_job_uid("lever", company, ext_id), company=company, vendor="lever",
external_job_id=ext_id, title=j.get("text") or "",
department=(j.get("categories") or {}).get("team"),
location_text=loc, remote=bool(re.search(r"remote", loc or "", re.I)),
work_type=(j.get("categories") or {}).get("commitment"),
posted_at=normalize_ts(j.get("createdAt")), updated_at=normalize_ts(j.get("updatedAt")),
apply_url=j.get("hostedUrl") or "", description_html=j.get("description") or None,
tags=j.get("tags") or None,
))
return jobs


VENDORS: Dict[str, Fetcher] = {
"greenhouse": ("token", fetch_greenhouse),
"lever": ("company", fetch_lever),
}