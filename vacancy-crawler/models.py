from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Tenant(BaseModel):
    vendor: str = Field(..., description="ATS vendor id, e.g., greenhouse, lever")
    token: str = Field(..., description="Tenant token/subdomain on the vendor")
    company: str = Field(..., description="Friendly company name")
    enabled: bool = True


class NormalizedJob(BaseModel):
    job_uid: str
    company: str
    vendor: str
    external_job_id: str
    title: str
    department: Optional[str] = None
    location_text: Optional[str] = None
    remote: Optional[bool] = None
    work_type: Optional[str] = None
    posted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    apply_url: str
    description_html: Optional[str] = None
    tags: Optional[List[str]] = None
    status: str = "open"
    first_seen_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    content_hash: Optional[str] = None