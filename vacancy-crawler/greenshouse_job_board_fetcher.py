#!/usr/bin/env python3
"""
Improved Greenhouse Board Token Fetcher
Handles interruptions gracefully and saves progress incrementally

Usage: python improved_fetcher.py
"""

import requests
import json
import time
import signal
import sys
import os
from datetime import datetime
from typing import List, Dict, Optional

class ImprovedGreenhouseFetcher:
    def __init__(self, progress_file="greenhouse_progress.json"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)'
        })
        
        self.progress_file = progress_file
        self.results = {'active': [], 'inactive': [], 'errors': []}
        self.processed_tokens = set()
        self.interrupted = False
        
        # Load existing progress
        self.load_progress()
        
        # Set up signal handlers for graceful interruption
        signal.signal(signal.SIGINT, self.handle_interrupt)
        signal.signal(signal.SIGTERM, self.handle_interrupt)
        
        # High-priority tokens to test first (based on your successful results)
        self.priority_tokens = [
            'airbnb', 'reddit', 'stripe', 'hubspot', 'duolingo', 'gitlab', 
            'dropbox', 'slack', 'zoom', 'uber', 'lyft', 'twitter', 'pinterest',
            'snapchat', 'tiktok', 'notion', 'figma', 'canva', 'discord',
            'coinbase', 'robinhood', 'square', 'paypal', 'shopify', 'etsy'
        ]
        
        # Extended token list
        self.extended_tokens = [
            # Tech companies
            'atlassian', 'twilio', 'docusign', 'crowdstrike', 'okta', 'datadog',
            'snowflake', 'palantir', 'unity', 'roblox', 'intercom', 'asana',
            'monday', 'airtable', 'linear', 'retool', 'salesforce', 'servicenow',
            'workday', 'zendesk', 'netflix', 'adobe', 'microsoft', 'google',
            'amazon', 'apple', 'facebook', 'meta', 'tesla', 'spacex',
            
            # Fintech
            'klarna', 'affirm', 'chime', 'plaid', 'wise', 'revolut', 'transferwise',
            'venmo', 'cashapp', 'zelle', 'razorpay', 'paytm', 'phonepe',
            
            # E-commerce & Marketplaces
            'wayfair', 'doordash', 'instacart', 'uber-eats', 'grubhub',
            'postmates', 'seamless', 'caviar', 'deliveroo', 'just-eat',
            
            # Startups & Scale-ups
            'openai', 'anthropic', 'databricks', 'bytedance', 'stabilityai',
            'midjourney', 'coursera', 'udemy', 'masterclass', 'skillshare',
            
            # Gaming
            'epicgames', 'riotgames', 'blizzard', 'activision', 'ea', 'ubisoft',
            'valve', 'steam', 'twitch', 'mixer', 'youtube-gaming',
            
            # Transportation & Mobility
            'bird', 'lime', 'rivian', 'waymo', 'cruise', 'ola', 'grab', 'gojek',
            
            # Healthcare & Biotech
            'peloton', 'moderna', 'teladoc', '23andme', 'color', 'ginkgo',
            'illumina', 'guardant', 'veracyte', 'exact-sciences',
            
            # International Companies
            'flipkart', 'zomato', 'swiggy', 'oyo', 'freshworks', 'zoho',
            'chargebee', 'zerodha', 'groww', 'cred', 'alteradigitalhealthindia',
            'wipro', 'tcs', 'infosys', 'hcl', 'techm', 'mindtree',
            
            # Additional variations
            'greenhouse', 'lever', 'workable', 'bamboohr', 'gusto', 'lattice',
            'culture-amp', 'glint', 'officevibe', '15five', 'bonusly',
        ]
        
        # Combine all tokens, removing duplicates while preserving priority order
        all_tokens = self.priority_tokens + [t for t in self.extended_tokens if t not in self.priority_tokens]
        self.tokens_to_test = [t for t in all_tokens if t not in self.processed_tokens]
    
    def handle_interrupt(self, signum, frame):
        """Handle graceful interruption"""
        print(f"\n⚠️  Interrupted! Saving progress...")
        self.interrupted = True
        self.save_progress()
        self.generate_final_report()
        sys.exit(0)
    
    def load_progress(self):
        """Load existing progress from file"""
        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, 'r') as f:
                    data = json.load(f)
                    self.results = data.get('results', {'active': [], 'inactive': [], 'errors': []})
                    self.processed_tokens = set(data.get('processed_tokens', []))
                    
                print(f"📂 Loaded progress: {len(self.results['active'])} active, {len(self.processed_tokens)} processed")
            except Exception as e:
                print(f"⚠️  Could not load progress: {e}")
    
    def save_progress(self):
        """Save current progress"""
        progress_data = {
            'last_updated': datetime.now().isoformat(),
            'results': self.results,
            'processed_tokens': list(self.processed_tokens),
            'summary': {
                'active_count': len(self.results['active']),
                'inactive_count': len(self.results['inactive']),
                'error_count': len(self.results['errors']),
                'total_jobs': sum(r['job_count'] for r in self.results['active'])
            }
        }
        
        with open(self.progress_file, 'w') as f:
            json.dump(progress_data, f, indent=2)
    
    def test_token(self, token: str) -> Dict:
        """Test a single board token with enhanced error handling"""
        api_url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
        
        try:
            response = self.session.get(api_url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get('jobs', [])
                
                # Extract sample job titles
                sample_jobs = []
                for job in jobs[:5]:  # Get up to 5 sample jobs
                    title = job.get('title', '').strip()
                    if title and title not in sample_jobs:
                        sample_jobs.append(title)
                
                return {
                    'token': token,
                    'status': 'active',
                    'job_count': len(jobs),
                    'api_url': api_url,
                    'careers_url': f'https://boards.greenhouse.io/{token}',
                    'sample_jobs': sample_jobs[:3],  # Top 3 for display
                    'last_checked': datetime.now().isoformat()
                }
            elif response.status_code == 404:
                return {'token': token, 'status': 'inactive'}
            else:
                return {
                    'token': token, 
                    'status': 'error', 
                    'error': f'HTTP {response.status_code}'
                }
                
        except requests.Timeout:
            return {'token': token, 'status': 'error', 'error': 'Timeout'}
        except requests.ConnectionError:
            return {'token': token, 'status': 'error', 'error': 'Connection error'}
        except Exception as e:
            return {'token': token, 'status': 'error', 'error': str(e)}
    
    def fetch_tokens(self, batch_size: int = 10):
        """Fetch tokens with progress saving"""
        total_to_test = len(self.tokens_to_test)
        
        print(f"🔍 Testing {total_to_test} remaining tokens...")
        print(f"📊 Already found: {len(self.results['active'])} active tokens")
        print("-" * 60)
        
        for i, token in enumerate(self.tokens_to_test):
            if self.interrupted:
                break
                
            current_index = len(self.processed_tokens) + i + 1
            total_tokens = len(self.processed_tokens) + total_to_test
            
            print(f"[{current_index:3}/{total_tokens}] Testing {token:20}...", end=' ')
            
            result = self.test_token(token)
            self.processed_tokens.add(token)
            
            if result['status'] == 'active':
                self.results['active'].append(result)
                print(f"✅ {result['job_count']} jobs")
                
                # Show sample jobs for high-count companies
                if result['job_count'] > 20 and result.get('sample_jobs'):
                    print(f"    Sample jobs: {', '.join(result['sample_jobs'])}")
                    
            elif result['status'] == 'inactive':
                self.results['inactive'].append(result)
                print("❌")
            else:
                self.results['errors'].append(result)
                error_msg = result.get('error', 'Unknown error')[:30]
                print(f"⚠️  {error_msg}")
            
            # Save progress every batch_size tokens
            if (i + 1) % batch_size == 0:
                self.save_progress()
                active_count = len(self.results['active'])
                total_jobs = sum(r['job_count'] for r in self.results['active'])
                print(f"    💾 Progress saved: {active_count} active tokens, {total_jobs} total jobs")
            
            # Rate limiting with some randomization to be more natural
            delay = 1.0 + (i % 3) * 0.2  # 1.0, 1.2, 1.4 seconds
            time.sleep(delay)
        
        # Final save
        self.save_progress()
    
    def generate_final_report(self):
        """Generate only a JSON final report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        active_tokens = self.results['active']
        total_jobs = sum(r['job_count'] for r in active_tokens)

        # Sort by job count
        active_tokens.sort(key=lambda x: x['job_count'], reverse=True)

        # 1. JSON Report (only)
        json_filename = f"greenhouse_report_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'summary': {
                    'total_active_tokens': len(active_tokens),
                    'total_job_openings': total_jobs,
                    'total_tested': len(self.processed_tokens),
                    'inactive_tokens': len(self.results['inactive']),
                    'error_count': len(self.results['errors'])
                },
                'active_companies': active_tokens,
                'inactive_tokens': [r['token'] for r in self.results['inactive']],
                'errors': self.results['errors']
            }, f, indent=2)

        return json_filename

    def run(self):
        """Run the complete discovery process"""
        print("🚀 Improved Greenhouse Board Token Fetcher")
        print("="*70)
        print("💡 Press Ctrl+C at any time to save progress and exit")
        print()
        
        try:
            # Fetch tokens
            self.fetch_tokens(batch_size=10)
            
            # Generate final report
            json_file = self.generate_final_report()
            
            # Print summary
            self.print_summary()
            
            # Show generated file
            print(f"\n💾 FILE GENERATED:")
            print(f"   📄 JSON report: {json_file}")
            print(f"   💾 Progress file: {self.progress_file}")
            
        except KeyboardInterrupt:
            self.handle_interrupt(None, None)
        
        return self.results

    def print_summary(self):
        """Print comprehensive summary"""
        active_tokens = self.results['active']
        total_jobs = sum(r['job_count'] for r in active_tokens)
        
        print("\n" + "="*70)
        print("🎉 GREENHOUSE DISCOVERY COMPLETE")
        print("="*70)
        print(f"✅ Active companies found: {len(active_tokens)}")
        print(f"💼 Total job openings: {total_jobs:,}")
        print(f"📊 Tokens tested: {len(self.processed_tokens)}")
        print(f"❌ Inactive tokens: {len(self.results['inactive'])}")
        print(f"⚠️  Errors encountered: {len(self.results['errors'])}")
        
        if active_tokens:
            # Sort by job count
            active_tokens.sort(key=lambda x: x['job_count'], reverse=True)
            
            print(f"\n🏆 TOP 20 COMPANIES BY JOB COUNT:")
            print("-" * 50)
            
            for i, company in enumerate(active_tokens[:20], 1):
                print(f"{i:2}. {company['token']:20} - {company['job_count']:4} jobs")
            
            # Show interesting insights
            high_volume = [c for c in active_tokens if c['job_count'] > 50]
            if high_volume:
                print(f"\n🔥 HIGH-VOLUME HIRING ({len(high_volume)} companies with 50+ jobs):")
                for company in high_volume[:10]:
                    sample_job = company.get('sample_jobs', [''])[0]
                    print(f"   {company['token']} ({company['job_count']} jobs) - {sample_job[:40]}...")

if __name__ == "__main__":
    fetcher = ImprovedGreenhouseFetcher()
    results = fetcher.run()
    
    # Clean up progress file if completed successfully
    if not fetcher.interrupted and os.path.exists(fetcher.progress_file):
        os.remove(fetcher.progress_file)
        print(f"🧹 Cleaned up progress file")
    
    print(f"\n✨ Process complete! Check the generated JSON file for your board tokens.")