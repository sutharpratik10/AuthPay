
import json
import os
import asyncio
import aiohttp
from collections import defaultdict

def fetch_and_group_jobs(input_path, output_path):
    # Load grouped_by_ats.json
    with open(input_path, 'r', encoding='utf-8') as f:
        grouped_data = json.load(f)

    # Prepare grouped output
    grouped_jobs = defaultdict(list)

    async def fetch_job(session, ats_name, board):
        token = board.get('token')
        board_api_url = board.get('board_api_url')
        if not board_api_url or not token:
            return None, None, None
        try:
            async with session.get(board_api_url, timeout=10) as resp:
                resp.raise_for_status()
                jobs = await resp.json()
                return token, ats_name, {'ats': ats_name, 'board': board, 'jobs': jobs}
        except Exception as e:
            print(f"Failed to fetch jobs for {ats_name}/{token}: {e}")
            return None, None, None

    async def fetch_all_jobs():
        grouped_jobs = defaultdict(list)
        async with aiohttp.ClientSession() as session:
            tasks = []
            for ats_name, boards in grouped_data.items():
                if not isinstance(boards, list):
                    continue
                for board in boards:
                    tasks.append(fetch_job(session, ats_name, board))
            results = await asyncio.gather(*tasks)
            for token, ats_name, job_data in results:
                if token and job_data:
                    grouped_jobs[token].append(job_data)
        return grouped_jobs

    grouped_jobs = asyncio.run(fetch_all_jobs())

    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(grouped_jobs, f, indent=2)

if __name__ == "__main__":
    input_path = os.path.join(os.path.dirname(__file__), 'scrapped', 'grouped_by_ats.json')
    output_path = os.path.join(os.path.dirname(__file__), 'scrapped', 'jobs.json')
    fetch_and_group_jobs(input_path, output_path)
