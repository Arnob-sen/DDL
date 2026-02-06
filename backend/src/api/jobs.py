from fastapi import APIRouter, HTTPException
from ..workers.manager import job_manager

router = APIRouter(tags=["jobs"])

@router.get("/get-request-status/{job_id}")
async def get_request_status(job_id: str):
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
