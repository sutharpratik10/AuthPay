from __future__ import annotations
r.board_api_url = await derive_board_api_url(r)


async def upsert_api_row(r: CatalogRow) -> None:
now = datetime.utcnow()
doc = {"ats": r.ats, "token": r.token, "board_url": r.board_url, "board_api_url": r.board_api_url,
"source": r.source, "validated": bool(r.validated), "first_seen_at": now, "last_seen_at": now}
existing = await store.api.find_one({"ats": r.ats, "token": r.token})
if existing:
await store.api.update_one({"ats": r.ats, "token": r.token}, {"$set": {**doc, "first_seen_at": existing.get("first_seen_at", now)}})
else:
await store.api.update_one({"ats": r.ats, "token": r.token}, {"$set": doc}, upsert=True)


async def save_catalog_rows(rows: List[CatalogRow]) -> int:
for r in rows: await upsert_api_row(r)
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
rows: List[CatalogRow] = []
if req.mode in ("ct","both"):
rows.extend(await mine_ct(concurrency=req.concurrency, get_client=get_client))
if req.mode in ("cdx","both"):
rows.extend(await mine_cdx(since=req.since, until=req.until, concurrency=req.concurrency, get_client=get_client))
# dedupe
seen, deduped = set(), []
for r in rows:
k = (r.ats, r.token)
if k not in seen: seen.add(k); deduped.append(r)
await populate_board_api_urls_rows(deduped)
if not req.no_validate and deduped:
await validate_rows_catalog(deduped, max_concurrency=req.validate_concurrency, get_client=get_client)
await refine_workday_api_urls_rows(deduped, get_client=get_client)
saved = await save_catalog_rows(deduped)
return deduped, saved


# Router
router = APIRouter(prefix="/catalog/ats", tags=["catalog"])


@router.post("/build", response_model=CatalogBuildResponse)
async def catalog_build(req: CatalogBuildRequest = Body(default=CatalogBuildRequest())):
rows, saved = await build_catalog(req)
return CatalogBuildResponse(mode=req.mode, discovered=len(rows), validated_true=sum(1 for r in rows if r.validated), saved=saved)


@router.get("")
async def list_catalog(
ats: Optional[str] = Query(None),
validated: Optional[bool] = Query(None),
q: Optional[str] = Query(None, description="regex against token or board_url"),
limit: int = Query(50, ge=1, le=500),
skip: int = Query(0, ge=0),
):
query: Dict[str, Any] = {}
if ats: query["ats"] = ats
if validated is not None: query["validated"] = validated
if q:
regex = {"$regex": q, "$options": "i"}
query["$or"] = [{"token": regex}, {"board_url": regex}]
cursor = store.api.find(query, {"_id": 0}).sort("last_seen_at", -1).skip(skip).limit(limit)
items = [x async for x in cursor]
return {"count": len(items), "items": items}