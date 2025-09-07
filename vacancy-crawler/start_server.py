#!/usr/bin/env python3
"""
Complete job scraper microservice startup script
"""

import asyncio
import os
from datetime import datetime, timezone
from storage import store, ensure_api_collection_on_store
from jobs_service import ensure_jobs_indexes


async def setup_database():
    """Setup database with indexes and sample tenants"""
    print("🔧 Setting up database...")
    
    # Ensure API collection exists
    ensure_api_collection_on_store()
    
    # Create indexes
    await ensure_jobs_indexes()
    
    # Sample tenants for testing
    sample_tenants = [
        {
            "vendor": "greenhouse",
            "token": "airbnb",
            "company": "Airbnb",
            "enabled": True
        },
        {
            "vendor": "greenhouse", 
            "token": "shopify",
            "company": "Shopify",
            "enabled": True
        },
        {
            "vendor": "greenhouse",
            "token": "lyft",
            "company": "Lyft", 
            "enabled": True
        },
        {
            "vendor": "lever",
            "token": "mixer",
            "company": "Mixer",
            "enabled": True
        }
    ]
    
    for tenant_data in sample_tenants:
        existing = await store.tenants.find_one({
            "vendor": tenant_data["vendor"], 
            "token": tenant_data["token"]
        })
        
        if not existing:
            await store.tenants.insert_one({
                **tenant_data,
                "created_at": datetime.now(timezone.utc)
            })
            print(f"   ✅ Added tenant: {tenant_data['company']} ({tenant_data['vendor']})")
        else:
            print(f"   ℹ️  Tenant exists: {tenant_data['company']} ({tenant_data['vendor']})")
    
    print(f"📊 Using {store.backend} storage backend")
    print("✅ Database setup complete!")


async def main():
    """Main setup function"""
    await setup_database()
    
    print("\n🚀 Starting Job Scraper Microservice...")
    print("=" * 50)
    print("API Documentation: http://localhost:8000/docs")
    print("API Base URL:      http://localhost:8000")
    print("")
    print("Available endpoints:")
    print("  POST /scrape                - Scrape jobs from configured tenants")
    print("  GET  /jobs                  - List scraped jobs")
    print("  GET  /jobs/{job_uid}        - Get specific job details")
    print("  DELETE /jobs/closed/purge   - Purge old closed jobs")
    print("  GET  /__selftest            - Run self-tests")
    print("  POST /catalog/ats/build     - Build ATS catalog")
    print("  GET  /catalog/ats           - List ATS catalog")
    print("")
    print("To test job scraping:")
    print("  curl -X POST http://localhost:8000/scrape")
    print("")
    print("=" * 50)
    
    # Start FastAPI server
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutting down gracefully...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
