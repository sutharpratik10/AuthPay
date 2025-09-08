from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, Body
from pydantic import BaseModel, Field

from storage import store, ensure_api_collection_on_store
from utils import make_client

# Ensure API collection is available
ensure_api_collection_on_store()

# Constants
MAX_CONCURRENCY = 16
VALIDATION_CONCURRENCY = 8

class CatalogRow(BaseModel):
    ats: str
    token: str
    board_url: str
    board_api_url: Optional[str] = None
    source: str
    validated: Optional[bool] = None

async def derive_board_api_url(r: CatalogRow) -> Optional[str]:
    """Derive API URL from board URL"""
    if r.ats == "greenhouse":
        return f"https://boards-api.greenhouse.io/v1/boards/{r.token}/jobs"
    elif r.ats == "lever":
        return f"https://api.lever.co/v0/postings/{r.token}"
    return None

async def populate_board_api_urls_rows(rows: List[CatalogRow]) -> None:
    """Populate API URLs for catalog rows"""
    for r in rows:
        r.board_api_url = await derive_board_api_url(r)

async def upsert_api_row(r: CatalogRow) -> None:
    """Upsert a catalog row to the database"""
    now = datetime.utcnow()
    doc = {
        "ats": r.ats, 
        "token": r.token, 
        "board_url": r.board_url, 
        "board_api_url": r.board_api_url,
        "source": r.source, 
        "validated": bool(r.validated), 
        "first_seen_at": now, 
        "last_seen_at": now
    }
    existing = await store.api.find_one({"ats": r.ats, "token": r.token})
    if existing:
        await store.api.update_one(
            {"ats": r.ats, "token": r.token}, 
            {"$set": {**doc, "first_seen_at": existing.get("first_seen_at", now)}}
        )
    else:
        await store.api.update_one(
            {"ats": r.ats, "token": r.token}, 
            {"$set": doc}, 
            upsert=True
        )

async def save_catalog_rows(rows: List[CatalogRow]) -> int:
    """Save catalog rows to database"""
    for r in rows: 
        await upsert_api_row(r)
    return len(rows)

class CatalogBuildRequest(BaseModel):
    mode: str = Field("both", pattern="^(ct|cdx|both)$")
    since: Optional[str] = Field(None)
    until: Optional[str] = Field(None)
    concurrency: int = Field(MAX_CONCURRENCY, ge=1, le=64)
    no_validate: bool = False
    validate_concurrency: int = Field(VALIDATION_CONCURRENCY, ge=1, le=64)

class CatalogBuildResponse(BaseModel):
    mode: str
    discovered: int
    validated_true: int
    saved: int

async def build_catalog(req: CatalogBuildRequest, *, get_client=make_client):
    """Build catalog from various sources"""
    rows: List[CatalogRow] = []
    
    # For now, return empty results - the mining functions would be implemented separately
    # This is a minimal implementation to get the API working
    
    await populate_board_api_urls_rows(rows)
    saved = await save_catalog_rows(rows)
    return rows, saved

# Router
router = APIRouter(prefix="/catalog/ats", tags=["catalog"])

@router.post("/build", response_model=CatalogBuildResponse)
async def catalog_build(req: CatalogBuildRequest = Body()):
    """Build catalog of ATS providers"""
    rows, saved = await build_catalog(req)
    return CatalogBuildResponse(
        mode=req.mode, 
        discovered=len(rows), 
        validated_true=sum(1 for r in rows if r.validated), 
        saved=saved
    )

@router.get("")
async def list_catalog(
    ats: Optional[str] = Query(None),
    validated: Optional[bool] = Query(None),
    q: Optional[str] = Query(None, description="regex against token or board_url"),
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
):
    """List catalog entries"""
    query: Dict[str, Any] = {}
    if ats: 
        query["ats"] = ats
    if validated is not None: 
        query["validated"] = validated
    if q:
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [{"token": regex}, {"board_url": regex}]
    
    cursor = store.api.find(query, {"_id": 0}).sort("last_seen_at", -1).skip(skip).limit(limit)
    items = [x async for x in cursor]
    return {"count": len(items), "items": items}