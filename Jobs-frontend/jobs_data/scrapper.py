#!/usr/bin/env python3
"""
ATS company catalog builder (CT + Internet Archive CDX) with resilient paging
and grouped-by-ATS export.

- Mines subdomain-based ATS tenants from Certificate Transparency (crt.sh)
- Mines path-based ATS tokens from Internet Archive CDX (year-by-year windows)
- Optional lightweight token validation against public job-board APIs
- Saves flat JSON/CSV and/or grouped JSON by ATS

Usage examples:
  # Flat JSON
  python scrapper.py --mode both --out-json scrapped/ats_companies.json

  # Flat + Grouped (only validated in grouped)
  python scrapper.py --mode both --out-json scrapped/ats_companies.json \
    --grouped-json scrapped/grouped_by_ats.json --grouped-only-validated

  # Grouped only, skip flat
  python scrapper.py --mode both --no-flat \
    --grouped-json scrapped/grouped_by_ats.json

  # Tune CDX time range & concurrency
  python scrapper.py --mode cdx --since 2015 --until 2025 --concurrency 24 \
    --out-json scrapped/cdx.json

Flags:
  --mode {ct,cdx,both}     Which sources to mine (default: both)
  --since YYYY             (CDX) start year inclusive (default: 2012)
  --until YYYY             (CDX) end year inclusive (default: current year)
  --concurrency N          Max concurrent host/window tasks (default: 12)
  --no-validate            Skip token validation calls
  --validate-concurrency   Max concurrent validation requests (default: 10)
  --out-json PATH          Flat JSON output (array of rows)
  --out-csv PATH           Flat CSV output (optional)
  --no-flat                Do not write flat JSON/CSV
  --grouped-json PATH      Grouped JSON output (by ATS)
  --grouped-only-validated Include only validated rows in grouped output

Row schema (flat):
  {
    "ats": str,
    "token": str,
    "board_url": str,
    "board_api_url": str|null,
    "source": "ct"|"cdx",
    "validated": bool
  }

Grouped schema:
  {
    "workable": [
      {"token": "...", "board_url": "...", "board_api_url": "...", "source": "ct|cdx", "validated": true|false},
      ...
    ],
    "lever": [
      ...
    ],
    ...
  }
"""

from __future__ import annotations

import asyncio
import csv
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx
from tqdm import tqdm

UA = "ats-catalog-builder/1.0"

# ----------------------------- CONFIG ---------------------------------

# Subdomain ATS → mine via CT
CT_SUFFIXES = {
    # suffix                ats                 label_filter (optional regex for left label to skip infra)
    "workable.com":         ("workable",        None),
    "recruitee.com":        ("recruitee",       None),
    "jobs.personio.de":     ("personio",        None),
    "bamboohr.com":         ("bamboohr",        None),
    "teamtailor.com":       ("teamtailor",      None),
    "myworkdayjobs.com":    ("workday",         re.compile(r"^wd\d+(-.*)?$", re.I)),  # skip wdN infra
    "icims.com":            ("icims",           None),  # we'll later keep careers-* only

    # Extras (still useful for discovery)
    "breezy.hr":            ("breezy_hr",       None),
    "applytojob.com":       ("jazzhr",          None),
    "taleo.net":            ("oracle_taleo",    None),
    "zohorecruit.com":      ("zoho_recruit",    None),
    "jobdiva.com":          ("jobdiva",         None),
    "ceipal.com":           ("ceipal",          None),
}

# Path ATS → enumerate tokens from Internet Archive CDX (unique first path segment)
CDX_HOSTS = {
    "greenhouse":         {"host": "boards.greenhouse.io",      "exclude_first": {"embed"}},
    "lever":              {"host": "jobs.lever.co"},
    "ashby":              {"host": "jobs.ashbyhq.com"},
    "smartrecruiters":    {"host": "jobs.smartrecruiters.com"},
    "smartrecruiters2":   {"host": "careers.smartrecruiters.com"},
    "workable-apply":     {"host": "apply.workable.com"},
}

# Timeouts & concurrency
HTTP_TIMEOUT = 25.0
MAX_CONCURRENCY = 12
VALIDATION_CONCURRENCY = 10

# ----------------------------- MODELS ---------------------------------

@dataclass
class Row:
    ats: str
    token: str
    board_url: str
    source: str         # "ct" or "cdx"
    validated: bool = False
    board_api_url: Optional[str] = None

# ----------------------------- HELPERS --------------------------------

def uniq(seq):
    seen, out = set(), []
    for s in seq:
        if s not in seen:
            seen.add(s); out.append(s)
    return out

def left_label(host: str) -> Optional[str]:
    host = host.strip(".").lower()
    parts = host.split(".")
    return parts[0] if len(parts) >= 3 else None  # only subdomain hosts

# -------- derive public API URL (best guess; some vendors have none) ---

def derive_board_api_url(r: Row) -> Optional[str]:
    """
    Build a best-guess public API endpoint for this ATS/token.
    Some vendors (Teamtailor, iCIMS, etc.) don't expose an open jobs API → return None.
    Personio/BambooHR URLs use the actual domain from board_url to handle regional TLDs.
    """
    ats = r.ats.lower().strip()
    token = str(r.token).strip()
    if not token:
        return None

    # parse host from board_url for vendors with regional hosts
    try:
        parsed = urlparse(r.board_url)
        host = parsed.hostname or ""
    except Exception:
        host = ""

    if ats == "greenhouse":
        return f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"

    if ats == "lever":
        return f"https://api.lever.co/v0/postings/{token}?mode=json"

    if ats == "ashby":
        return f"https://api.ashbyhq.com/posting-api/job-board/{token}"

    if ats == "smartrecruiters":
        return f"https://api.smartrecruiters.com/v1/companies/{token}/postings"

    if ats == "workable":
        # Path form → apply API; subdomain form → SPI
        if r.board_url.startswith("https://apply.workable.com/"):
            return f"https://apply.workable.com/api/v3/accounts/{token}/jobs"
        return f"https://{token}.workable.com/spi/v3/jobs"

    if ats == "recruitee":
        return f"https://{token}.recruitee.com/api/offers/"

    if ats == "personio":
        # Expect r.board_url like: https://{company}.jobs.personio.{tld}/
        if host and "." in host:
            parts = host.split(".")
            if len(parts) >= 3 and parts[-3] == "personio":
                return f"https://{host}/xml"
        return f"https://{token}.jobs.personio.com/xml"

    if ats == "bamboohr":
        return f"https://{token}.bamboohr.com/careers/list"

    if ats == "workday":
        # Default to common site "Careers"; refined later if validation runs
        return f"https://{token}.myworkdayjobs.com/wday/cxs/{token}/Careers/jobs"

    return None

def populate_board_api_urls(rows: List[Row]) -> None:
    for r in rows:
        r.board_api_url = derive_board_api_url(r)

async def refine_workday_api_urls(rows: List[Row], max_concurrency: int = 10) -> None:
    """Probe common Workday sites to pick a working JSON endpoint (only for Workday rows)."""
    candidates = [r for r in rows if r.ats.lower() == "workday"]
    if not candidates:
        return
    sites = ("Careers", "careers", "Recruiting", "external")
    sem = asyncio.Semaphore(max_concurrency)
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, headers={"User-Agent": UA}) as client:
        async def one(r: Row):
            async with sem:
                for site in sites:
                    url = f"https://{r.token}.myworkdayjobs.com/wday/cxs/{r.token}/{site}/jobs?limit=1"
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            r.board_api_url = url
                            return
                    except Exception:
                        pass
                if not r.board_api_url:
                    r.board_api_url = derive_board_api_url(r)
        await asyncio.gather(*(one(r) for r in candidates))

# ----------------------------- CT MINING ------------------------------

async def crt_subdomains(client: httpx.AsyncClient, suffix: str) -> List[str]:
    """Query crt.sh for all names matching %.suffix; return unique hostnames."""
    url = "https://crt.sh/"
    params = {"q": f"%.{suffix}", "output": "json"}
    try:
        r = await client.get(url, params=params, timeout=HTTP_TIMEOUT, headers={"User-Agent": UA})
        if r.status_code != 200:
            return []
        data = r.json()
    except Exception:
        return []

    hosts = []
    for item in data if isinstance(data, list) else []:
        nv = item.get("name_value")
        if not nv:
            continue
        for line in str(nv).splitlines():
            h = line.strip().lower().rstrip(".")
            if h.endswith("." + suffix) and h.count(".") >= 2:
                hosts.append(h)
    return uniq(hosts)

async def mine_ct(concurrency: int = MAX_CONCURRENCY) -> List[Row]:
    rows: List[Row] = []
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, headers={"User-Agent": UA}) as client:
        pbar = tqdm(total=len(CT_SUFFIXES), desc="CT suffixes", unit="suffix", dynamic_ncols=True)

        async def task(suffix: str, ats: str, label_filter: Optional[re.Pattern]):
            async with sem:
                try:
                    hosts = await crt_subdomains(client, suffix)
                    for h in hosts:
                        label = left_label(h)
                        if not label:
                            continue
                        if suffix == "myworkdayjobs.com":
                            if label_filter and label_filter.match(label):
                                continue
                            rows.append(Row("workday", label, f"https://{label}.myworkdayjobs.com/", "ct"))
                        elif suffix == "icims.com":
                            if not (label.startswith("careers-") or label.endswith("-careers")):
                                continue
                            rows.append(Row("icims", label, f"https://{h}/jobs", "ct"))
                        else:
                            rows.append(Row(ats, label, f"https://{label}.{suffix}/", "ct"))
                finally:
                    pbar.update(1)

        tasks = [asyncio.create_task(task(suffix, ats, filt)) for suffix, (ats, filt) in CT_SUFFIXES.items()]
        await asyncio.gather(*tasks)
        pbar.close()

    # dedupe by (ats, token)
    seen, out = set(), []
    for r in rows:
        key = (r.ats, r.token)
        if key not in seen:
            seen.add(key); out.append(r)
    return out

# ----------------------------- CDX MINING -----------------------------

def _year_windows(since: Optional[str], until: Optional[str]) -> List[Tuple[str, str]]:
    """Return list of CDX time windows like [("YYYY0101000000","YYYY1231235959"), ...]."""
    def year_or_default(s: Optional[str], default: int) -> int:
        try:
            return int(str(s)[:4]) if s else default
        except Exception:
            return default

    first_year = year_or_default(since, 2012)
    last_year  = year_or_default(until, datetime.utcnow().year)

    return [(f"{y}0101000000", f"{y}1231235959") for y in range(first_year, last_year + 1)]

async def _cdx_fetch_window(
    client: httpx.AsyncClient,
    host: str,
    start: str,
    end: str,
    limit: int = 50000,
    retries: int = 4,
    backoff: float = 1.8,
) -> List[str]:
    url = "https://web.archive.org/cdx/search/cdx"
    params = {
        "url": f"{host}/*",
        "output": "json",
        "fl": "original",
        "collapse": "urlkey",
        "filter": "statuscode:200",
        "from": start,
        "to": end,
        "limit": limit,
    }
    attempt = 0
    while True:
        try:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            urls = [row[0] for row in data[1:] if isinstance(row, list) and row]
            tokens: List[str] = []
            for u in urls:
                try:
                    path = u.split(host, 1)[1]
                    segs = [s for s in path.split("/") if s]
                    if segs:
                        tokens.append(segs[0])
                except Exception:
                    pass
            seen, out = set(), []
            for t in tokens:
                if t not in seen:
                    seen.add(t); out.append(t)
            return out

        except (httpx.ReadTimeout, httpx.ReadError, httpx.ConnectError, httpx.HTTPError):
            attempt += 1
            if attempt > retries:
                return []
            await asyncio.sleep(min(30, backoff ** attempt))

async def cdx_first_segments(
    client: httpx.AsyncClient,
    host: str,
    since: Optional[str] = None,
    until: Optional[str] = None,
) -> List[str]:
    tokens: List[str] = []
    seen: set = set()
    for start, end in _year_windows(since, until):
        chunk = await _cdx_fetch_window(client, host, start, end)
        for t in chunk:
            if t not in seen:
                seen.add(t); tokens.append(t)
    return tokens

async def mine_cdx(
    since: Optional[str] = None,
    until: Optional[str] = None,
    concurrency: int = MAX_CONCURRENCY,
) -> List[Row]:
    rows: List[Row] = []
    sem = asyncio.Semaphore(concurrency)

    timeout = httpx.Timeout(connect=10.0, read=45.0, write=20.0, pool=60.0)
    limits  = httpx.Limits(max_connections=concurrency * 2,
                           max_keepalive_connections=concurrency)

    async with httpx.AsyncClient(timeout=timeout, headers={"User-Agent": UA}, limits=limits) as client:
        pbar = tqdm(total=len(CDX_HOSTS), desc="CDX hosts", unit="host", dynamic_ncols=True)

        async def do_host(tag: str, host: str, exclude_first: Optional[set] = None):
            nonlocal rows
            async with sem:
                try:
                    toks = await cdx_first_segments(client, host, since=since, until=until)
                    cleaned: List[str] = []
                    for t in toks:
                        t = t.strip().strip("/").split("?")[0].split("#")[0]
                        if not t or (exclude_first and t in exclude_first):
                            continue
                        cleaned.append(t.lower())

                    seen = set(); uniq_list = []
                    for t in cleaned:
                        if t not in seen:
                            seen.add(t); uniq_list.append(t)

                    for t in uniq_list:
                        if tag == "greenhouse":
                            rows.append(Row("greenhouse", t, f"https://boards.greenhouse.io/{t}", "cdx"))
                        elif tag in ("smartrecruiters", "smartrecruiters2"):
                            rows.append(Row("smartrecruiters", t, f"https://careers.smartrecruiters.com/{t}", "cdx"))
                        elif tag == "lever":
                            rows.append(Row("lever", t, f"https://jobs.lever.co/{t}", "cdx"))
                        elif tag == "ashby":
                            rows.append(Row("ashby", t, f"https://jobs.ashbyhq.com/{t}", "cdx"))
                        elif tag == "workable-apply":
                            rows.append(Row("workable", t, f"https://apply.workable.com/{t}/", "cdx"))
                finally:
                    pbar.update(1)

        tasks = [
            asyncio.create_task(do_host(tag, cfg["host"], set(cfg.get("exclude_first", []))))
            for tag, cfg in CDX_HOSTS.items()
        ]
        await asyncio.gather(*tasks)
        pbar.close()

    # global de-dupe (ats, token)
    seen, out = set(), []
    for r in rows:
        key = (r.ats, r.token)
        if key not in seen:
            seen.add(key); out.append(r)
    return out

# ----------------------------- VALIDATION -----------------------------

async def validate_row(client: httpx.AsyncClient, r: Row) -> bool:
    """Lightweight validation per ATS (HTTP 200/OK considered valid)."""
    try:
        if r.ats == "greenhouse":
            resp = await client.get(f"https://boards-api.greenhouse.io/v1/boards/{r.token}", timeout=HTTP_TIMEOUT)
            return resp.status_code == 200
        if r.ats == "lever":
            resp = await client.get(f"https://api.lever.co/v0/postings/{r.token}?limit=1&mode=json", timeout=HTTP_TIMEOUT)
            return resp.status_code == 200
        if r.ats == "smartrecruiters":
            resp = await client.get(f"https://api.smartrecruiters.com/v1/companies/{r.token}/postings?limit=1", timeout=HTTP_TIMEOUT)
            return resp.status_code == 200
        if r.ats == "ashby":
            resp = await client.get(f"https://jobs.ashbyhq.com/{r.token}", timeout=HTTP_TIMEOUT)
            return resp.status_code in (200, 301, 302)
        if r.ats == "workable":
            resp = await client.get(f"https://apply.workable.com/api/v3/accounts/{r.token}/jobs?limit=1", timeout=HTTP_TIMEOUT)
            if resp.status_code == 200:
                return True
            resp2 = await client.get(r.board_url, timeout=HTTP_TIMEOUT)
            return resp2.status_code in (200, 301, 302)
        if r.ats == "recruitee":
            resp = await client.get(f"https://{r.token}.recruitee.com/api/offers/", timeout=HTTP_TIMEOUT)
            return resp.status_code == 200
        if r.ats == "personio":
            resp = await client.get(r.board_url, timeout=HTTP_TIMEOUT)
            return resp.status_code in (200, 301, 302)
        if r.ats == "bamboohr":
            resp = await client.get(f"https://{r.token}.bamboohr.com/careers/", timeout=HTTP_TIMEOUT)
            return resp.status_code in (200, 301, 302)
        if r.ats == "teamtailor":
            resp = await client.get(f"https://{r.token}.teamtailor.com/", timeout=HTTP_TIMEOUT)
            return resp.status_code in (200, 301, 302)
        if r.ats == "workday":
            for site in ("Careers", "career", "careers", "Recruiting", "external"):
                url = f"https://{r.token}.myworkdayjobs.com/wday/cxs/{r.token}/{site}/jobs?limit=1"
                resp = await client.get(url, timeout=HTTP_TIMEOUT)
                if resp.status_code == 200:
                    return True
            resp = await client.get(r.board_url, timeout=HTTP_TIMEOUT)
            return resp.status_code in (200, 301, 302)
        if r.ats == "icims":
            resp = await client.get(r.board_url, timeout=HTTP_TIMEOUT)
            return resp.status_code in (200, 301, 302)
    except Exception:
        return False
    return False

async def validate_rows(
    rows: List[Row],
    max_concurrency: int = VALIDATION_CONCURRENCY,
    desc: str = "Validating",
    sample: Optional[int] = None,  # validate first N if set
) -> List[Row]:
    work = rows if sample is None else rows[:sample]
    sem = asyncio.Semaphore(max_concurrency)
    pbar = tqdm(
        total=len(work),
        desc=desc,
        unit="token",
        dynamic_ncols=True,
        smoothing=0.1,
        leave=True,
        bar_format="{desc}: {percentage:6.2f}%|{bar}| {n_fmt}/{total_fmt} "
                   "[{elapsed}<{remaining}, {rate_fmt}]"
    )
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, headers={"User-Agent": UA}) as client:
        async def one(i: int):
            async with sem:
                try:
                    ok = await validate_row(client, work[i])
                    work[i].validated = bool(ok)
                except Exception:
                    work[i].validated = False
                finally:
                    pbar.update(1)
        await asyncio.gather(*(one(i) for i in range(len(work))))
    pbar.close()
    return rows

# ----------------------------- OUTPUT ---------------------------------

def to_csv(path: Path, rows: List[Row]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["ats", "token", "board_url", "board_api_url", "source", "validated"]
        )
        w.writeheader()
        for r in rows:
            w.writerow(asdict(r))

def to_json(path: Path, rows: List[Row]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps([asdict(r) for r in rows], ensure_ascii=False, indent=2), encoding="utf-8")

def to_grouped_json(path: Path, rows: List[Row], only_validated: bool = False) -> None:
    """
    Write a grouped JSON like:
    {
      "workable": [
        {"token": "...", "board_url": "...", "board_api_url": "...", "source": "...", "validated": true},
        ...
      ],
      "lever": [ ... ]
    }
    """
    group: Dict[str, List[Dict[str, Any]]] = {}
    for r in rows:
        if only_validated and not r.validated:
            continue
        group.setdefault(r.ats, []).append({
            "token": r.token,
            "board_url": r.board_url,
            "board_api_url": r.board_api_url,
            "source": r.source,
            "validated": r.validated,
        })
    # Optional: sort tokens inside each ATS bucket for determinism
    for ats in group:
        group[ats].sort(key=lambda x: (x["token"], x["board_url"]))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(group, ensure_ascii=False, indent=2), encoding="utf-8")

def dedupe(rows: List[Row]) -> List[Row]:
    seen, out = set(), []
    for r in rows:
        key = (r.ats, r.token)
        if key not in seen:
            seen.add(key); out.append(r)
    return out

# ----------------------------- MAIN -----------------------------------

async def run(
    mode: str,
    out_json: Optional[str],
    out_csv: Optional[str],
    do_validate: bool,
    validate_conc: int,
    since: Optional[str],
    until: Optional[str],
    concurrency: int,
    grouped_json: Optional[str],
    grouped_only_validated: bool,
    no_flat: bool,
) -> None:
    all_rows: List[Row] = []

    if mode in ("ct", "both"):
        print("🔎 Mining Certificate Transparency…")
        ct_rows = await mine_ct(concurrency=concurrency)
        print(f"  CT candidates: {len(ct_rows):,}")
        all_rows.extend(ct_rows)

    if mode in ("cdx", "both"):
        print("🧭 Mining Internet Archive CDX…")
        cdx_rows = await mine_cdx(since=since, until=until, concurrency=concurrency)
        print(f"  CDX candidates: {len(cdx_rows):,}")
        all_rows.extend(cdx_rows)

    all_rows = dedupe(all_rows)
    print(f"🧮 Unique (pre-validation): {len(all_rows):,}")

    # Populate derived API URLs now
    populate_board_api_urls(all_rows)

    if do_validate and all_rows:
        print("✅ Validating tokens (lightweight)…")
        await validate_rows(all_rows, desc="Validating", max_concurrency=validate_conc)
        await refine_workday_api_urls(all_rows)

    # Flat outputs
    if not no_flat:
        if out_json:
            to_json(Path(out_json), all_rows)
        if out_csv:
            to_csv(Path(out_csv), all_rows)
        if out_json or out_csv:
            msg = "✅ Saved flat outputs"
            if out_json: msg += f" → {out_json}"
            if out_csv:  msg += f" and {out_csv}"
            print(msg)

    # Grouped output
    if grouped_json:
        to_grouped_json(Path(grouped_json), all_rows, only_validated=grouped_only_validated)
        print(f"✅ Wrote grouped-by-ATS JSON → {grouped_json}")

def main():
    import argparse
    p = argparse.ArgumentParser(description="Enumerate companies using ATS via CT + CDX + validation, with grouped export.")
    p.add_argument("--mode", choices=["ct","cdx","both"], default="both",
                   help="Which sources to mine (default: both)")
    p.add_argument("--since", default=None, help="(CDX) start year inclusive, e.g., 2015")
    p.add_argument("--until", default=None, help="(CDX) end year inclusive, e.g., 2025")
    p.add_argument("--concurrency", type=int, default=MAX_CONCURRENCY,
                   help=f"Max concurrent host/window tasks (default: {MAX_CONCURRENCY})")

    # flat outputs
    p.add_argument("--out-json", default="ats_companies.json", help="Flat JSON (array of rows)")
    p.add_argument("--out-csv", default=None, help="Flat CSV (optional)")
    p.add_argument("--no-flat", action="store_true", help="Skip flat outputs")

    # validation
    p.add_argument("--no-validate", action="store_true", help="Skip validation requests")
    p.add_argument("--validate-concurrency", type=int, default=VALIDATION_CONCURRENCY,
                   help=f"Max concurrent validation requests (default: {VALIDATION_CONCURRENCY})")

    # grouped export
    p.add_argument("--grouped-json", default=None, help="Write grouped JSON (by ATS) to this path")
    p.add_argument("--grouped-only-validated", action="store_true",
                   help="Use only rows with validated=true in grouped output")

    args = p.parse_args()

    asyncio.run(run(
        mode=args.mode,
        out_json=None if args.no_flat else args.out_json,
        out_csv=None if args.no_flat else args.out_csv,
        do_validate=not args.no_validate,
        validate_conc=args.validate_concurrency,
        since=args.since,
        until=args.until,
        concurrency=args.concurrency,
        grouped_json=args.grouped_json,
        grouped_only_validated=args.grouped_only_validated,
        no_flat=args.no_flat,
    ))

if __name__ == "__main__":
    main()
