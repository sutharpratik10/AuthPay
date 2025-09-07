#!/usr/bin/env python3
"""
Setup script to initialize the job scraper microservice with sample tenants
and then start the FastAPI server.
"""

import asyncio
import os
from datetime import datetime, timezone
from storage import store
from jobs_service import ensure_jobs_indexes
from models import Tenant


async def setup_sample_tenants():
    """Setup some sample tenants for testing"""
    print("Setting up sample tenants...")
    
    # Create indexes first
    await ensure_jobs_indexes()
    
    # Sample tenants - these are publicly accessible job boards
    sample_tenants = [
        {
            "vendor": "greenhouse",
            "token": "airbnb",  # Airbnb's public job board
            "company": "Airbnb",
            "enabled": True
        },
        {
            "vendor": "greenhouse", 
            "token": "shopify",  # Shopify's public job board
            "company": "Shopify",
            "enabled": True
        },
        {
            "vendor": "lever",
            "token": "netflix",  # Netflix's public job board
            "company": "Netflix", 
            "enabled": True
        },
        {
            "vendor": "lever",
            "token": "uber",  # Uber's public job board
            "company": "Uber",
            "enabled": True
        }
    ]
    
    for tenant_data in sample_tenants:
        # Check if tenant already exists
        existing = await store.tenants.find_one({
            "vendor": tenant_data["vendor"], 
            "token": tenant_data["token"]
        })
        
        if not existing:
            await store.tenants.insert_one({
                **tenant_data,
                "created_at": datetime.now(timezone.utc)
            })
            print(f"Added tenant: {tenant_data['company']} ({tenant_data['vendor']})")
        else:
            print(f"Tenant already exists: {tenant_data['company']} ({tenant_data['vendor']})")
    
    print(f"Setup complete! Using {store.backend} storage backend.")


async def main():
    """Main setup and run function"""
    await setup_sample_tenants()
    
    # Now start the FastAPI server
    print("\nStarting FastAPI server...")
    print("API will be available at: http://localhost:8000")
    print("API docs will be available at: http://localhost:8000/docs")
    print("\nTo test the job scraping, make a POST request to: http://localhost:8000/scrape")
    print("To view scraped jobs, visit: http://localhost:8000/jobs")
    
    # Import and run the FastAPI app
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    asyncio.run(main())
