from __future__ import annotations
import os
from typing import Any, Dict, Optional

# --- Result shims for in-memory collections ---
class _UpdateResult:
    def __init__(self, modified_count: int = 0):
        self.modified_count = modified_count

class _DeleteResult:
    def __init__(self, deleted_count: int = 0):
        self.deleted_count = deleted_count

class _InMemoryCursor:
    def __init__(self, docs):
        self._docs = docs
        self._skip = 0
        self._limit = None
        self._sort_key = None
        self._sort_dir = 1

    def sort(self, key, direction):
        self._sort_key, self._sort_dir = key, direction
        return self

    def skip(self, n):
        self._skip = n
        return self

    def limit(self, n):
        self._limit = n
        return self

    def _iter_docs(self):
        docs = list(self._docs)
        if self._sort_key:
            docs.sort(key=lambda d: d.get(self._sort_key), reverse=self._sort_dir < 0)
        if self._skip:
            docs = docs[self._skip:]
        if self._limit is not None:
            docs = docs[:self._limit]
        return docs

    async def __aiter__(self):
        for d in self._iter_docs():
            yield d

class _InMemoryCollection:
    def __init__(self, name: str):
        self._name = name
        self._docs = []

    async def create_index(self, *args, **kwargs):
        return None

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for key, cond in (query or {}).items():
            if doc.get(key) != cond:
                return False
        return True

    def _project(self, doc: Dict[str, Any], projection: Optional[Dict[str, int]]):
        if not projection:
            return dict(doc)
        d = dict(doc)
        if projection.get("_id") == 0 and "_id" in d:
            d.pop("_id", None)
        return d

    async def find_one(self, q, projection=None):
        for d in self._docs:
            if self._matches(d, q):
                return self._project(d, projection)
        return None

    def find(self, q, projection=None) -> _InMemoryCursor:
        rows = [self._project(d, projection) for d in self._docs if self._matches(d, q)]
        return _InMemoryCursor(rows)

    async def insert_one(self, doc):
        self._docs.append(dict(doc))
        return None

    async def update_one(self, flt, update, upsert=False):
        for d in self._docs:
            if self._matches(d, flt):
                if "$set" in update:
                    d.update(update["$set"])
                return _UpdateResult(modified_count=1)
        if upsert:
            base = dict(flt)
            if "$set" in update:
                base.update(update["$set"])
            self._docs.append(base)
            return _UpdateResult(modified_count=1)
        return _UpdateResult(0)

    async def update_many(self, flt, update):
        cnt = 0
        for d in self._docs:
            if self._matches(d, flt):
                if "$set" in update:
                    d.update(update["$set"])
                cnt += 1
        return _UpdateResult(cnt)

    async def delete_many(self, flt):
        before = len(self._docs)
        self._docs = [d for d in self._docs if not self._matches(d, flt)]
        return _DeleteResult(before - len(self._docs))

# --- Mongo or memory store selection ---
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    _motor_available = True
except ImportError:
    _motor_available = False

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "mongo").lower()
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "scrapped_jobs")

class Store:
    backend: str = ""
    jobs: Any = None
    tenants: Any = None
    api: Any = None

if _motor_available and STORAGE_BACKEND == "mongo":
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        _mongo_client = AsyncIOMotorClient(MONGODB_URL)
        _mongo_db = _mongo_client[MONGODB_DB]
        class _MongoCollection:
            def __init__(self, coll):
                self._c = coll
            async def create_index(self, *a, **k): return await self._c.create_index(*a, **k)
            async def find_one(self, q, projection=None): return await self._c.find_one(q, projection)
            def find(self, q, projection=None): return self._c.find(q, projection)
            async def insert_one(self, doc): return await self._c.insert_one(doc)
            async def update_one(self, *a, **k): return await self._c.update_one(*a, **k)
            async def update_many(self, *a, **k): return await self._c.update_many(*a, **k)
            async def delete_many(self, *a, **k): return await self._c.delete_many(*a, **k)
        store = Store()
        store.backend = "mongo"
        store.jobs = _MongoCollection(_mongo_db.jobs)
        store.tenants = _MongoCollection(_mongo_db.tenants)
    except NameError:
        _mongo_client = None
        _mongo_db = None
        store = Store()
        store.backend = "memory"
        store.jobs = _InMemoryCollection("jobs")
        store.tenants = _InMemoryCollection("tenants")
else:
    _mongo_client = None
    _mongo_db = None
    store = Store()
    store.backend = "memory"
    store.jobs = _InMemoryCollection("jobs")
    store.tenants = _InMemoryCollection("tenants")

# --- Helpers exposed to other modules ---

def get_backend() -> str:
    return store.backend

def get_mongo_db():
    return _mongo_db

def ensure_api_collection_on_store():
    """Attach `api` collection to store if missing."""
    if getattr(store, "backend", "memory") == "mongo":
        if not hasattr(store, "api"):
            store.api = _MongoCollection(_mongo_db.api)  # type: ignore[attr-defined]
    else:
        if not hasattr(store, "api"):
            store.api = _InMemoryCollection("api")  # type: ignore[attr-defined]