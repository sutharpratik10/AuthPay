from __future__ import annotations
import asyncio
import hashlib
import socket
from datetime import datetime, timezone
from typing import Any, Callable, Optional
import httpx

from settings import USER_AGENT, DEFAULT_TIMEOUT, HTTPX_LIMITS


# crypto helpers


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def deterministic_job_uid(vendor: str, token: str, external_job_id: str) -> str:
    return sha256(f"{vendor}|{token}|{external_job_id}")


# time helpers


def normalize_ts(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if value > 10_000_000_000:
            value = value / 1000.0  # ms → s
        return datetime.fromtimestamp(value, tz=timezone.utc)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            pass
    return None


# httpx factory
_GetClient = Callable[[], httpx.AsyncClient]


def make_client(transport: Optional[httpx.BaseTransport] = None) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=DEFAULT_TIMEOUT,
        headers={"User-Agent": USER_AGENT},
        limits=HTTPX_LIMITS,
        transport=transport,
        verify=True,
        trust_env=True,
    )


# safe launcher helpers


def can_bind_uvicorn() -> bool:
    return hasattr(socket, "SO_REUSEADDR")


def run_coro_safely(coro):
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    import threading
    result = {}
    error = {}
    
    def _runner():
        try:
            result["value"] = asyncio.run(coro)
        except BaseException as e:  # noqa: BLE001
            error["exc"] = e
    
    t = threading.Thread(target=_runner, daemon=True)
    t.start()
    t.join()
    if error:
        raise error["exc"]
    return result.get("value")
