#!/usr/bin/env python3
"""
Minimal test for job fetching without catalog dependency
"""

import asyncio
from storage import store, ensure_api_collection_on_store
from jobs_service import ensure_jobs_indexes
from fetchers import fetch_greenhouse, fetch_lever


async def minimal_test():
    """Minimal test of job fetching functionality"""
    print("🔧 Setting up...")
    ensure_api_collection_on_store()
    await ensure_jobs_indexes()
    
    print("\n🏢 Testing Greenhouse fetching...")
    try:
        # Test Greenhouse fetching with a known public board
        jobs = await fetch_greenhouse("airbnb")
        print(f"✅ Successfully fetched {len(jobs)} jobs from Airbnb (Greenhouse)")
        if jobs:
            print(f"   Example job: {jobs[0].title}")
            print(f"   Apply URL: {jobs[0].apply_url}")
            print(f"   Department: {jobs[0].department}")
    except Exception as e:
        print(f"❌ Greenhouse test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🎯 Testing Lever fetching...")
    try:
        # Test Lever fetching
        jobs = await fetch_lever("netflix")
        print(f"✅ Successfully fetched {len(jobs)} jobs from Netflix (Lever)")
        if jobs:
            print(f"   Example job: {jobs[0].title}")
            print(f"   Apply URL: {jobs[0].apply_url}")
            print(f"   Department: {jobs[0].department}")
    except Exception as e:
        print(f"❌ Lever test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n📊 Storage backend: {store.backend}")
    print("✨ Basic testing completed!")


if __name__ == "__main__":
    asyncio.run(minimal_test())
