from fastapi import APIRouter, HTTPException
from ..workers.manager import job_manager

router = APIRouter(tags=["jobs"])

@router.get("/get-request-status/{job_id}")
async def get_request_status(job_id: str):
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
@router.get("/jobs/active")
async def list_active_jobs():
    from ..storage.db import storage
    db = storage.get_db()
    jobs = await db.jobs.find({"status": {"$in": ["RUNNING", "PENDING"]}}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return jobs
