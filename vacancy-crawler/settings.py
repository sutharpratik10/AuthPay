from __future__ import annotations
import os
import httpx


# Environment
STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "mongo").lower()
MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB: str = os.getenv("MONGODB_DB", "scrapped_jobs")


# HTTP / User-Agent
USER_AGENT: str = os.getenv("SCRAPER_UA", "OpenJobsBot/1.0 (+contact: jobs@example.com)")
ATS_UA: str = "ats-catalog-builder/1.0"


# httpx defaults
DEFAULT_TIMEOUT = httpx.Timeout(20.0, connect=10.0)
HTTPX_LIMITS = httpx.Limits(max_connections=10, max_keepalive_connections=5)