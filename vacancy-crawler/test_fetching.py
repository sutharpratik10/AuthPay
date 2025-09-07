#!/usr/bin/env python3
"""
Test script to verify job fetching functionality
"""

import asyncio
import json
from storage import store
from jobs_service import ensure_jobs_indexes
from fetchers import fetch_greenhouse, fetch_lever
from app import app


async def test_job_fetching():
    """Test the job fetching functionality"""
    print("🔧 Setting up indexes...")
    await ensure_jobs_indexes()
    
    print("\n🏢 Testing Greenhouse fetching...")
    try:
        # Test Greenhouse fetching with Airbnb's public board
        jobs = await fetch_greenhouse("airbnb")
        print(f"✅ Successfully fetched {len(jobs)} jobs from Airbnb (Greenhouse)")
        if jobs:
            print(f"   Example job: {jobs[0].title} - {jobs[0].apply_url}")
    except Exception as e:
        print(f"❌ Greenhouse test failed: {e}")
    
    print("\n🎯 Testing Lever fetching...")
    try:
        # Test Lever fetching with Netflix's public board  
        jobs = await fetch_lever("netflix")
        print(f"✅ Successfully fetched {len(jobs)} jobs from Netflix (Lever)")
        if jobs:
            print(f"   Example job: {jobs[0].title} - {jobs[0].apply_url}")
    except Exception as e:
        print(f"❌ Lever test failed: {e}")
    
    print(f"\n📊 Storage backend: {store.backend}")
    
    # Test the complete scraping pipeline
    print("\n🔄 Testing complete scraping pipeline...")
    
    # Add a test tenant
    await store.tenants.update_one(
        {"vendor": "greenhouse", "token": "airbnb"},
        {"$set": {
            "vendor": "greenhouse",
            "token": "airbnb", 
            "company": "Airbnb",
            "enabled": True
        }},
        upsert=True
    )
    
    # Use the FastAPI app's scrape endpoint
    from app import scrape, ScrapeRequest
    
    try:
        req = ScrapeRequest(vendor="greenhouse", token="airbnb")
        result = await scrape(req)
        print(f"✅ Scraping pipeline completed:")
        print(f"   Tenants processed: {result['tenants']}")
        print(f"   Jobs fetched: {result['fetched']}")
        print(f"   Jobs inserted: {result['inserted']}")
        print(f"   Jobs updated: {result['updated']}")
        print(f"   Stale jobs closed: {result['closed_marked']}")
        
        # Check what's in the database
        cursor = store.jobs.find({})
        jobs_in_db = [job async for job in cursor]
        print(f"   Total jobs in database: {len(jobs_in_db)}")
        
    except Exception as e:
        print(f"❌ Scraping pipeline test failed: {e}")
    
    print("\n✨ Testing completed!")


if __name__ == "__main__":
    asyncio.run(test_job_fetching())
