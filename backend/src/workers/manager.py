from datetime import datetime
from typing import Dict, Optional, Any
from ..models.models import RequestStatus, JobStatus, RequestStatusType
from ..storage.db import storage

class JobManager:
    async def create_job(self, job_type: RequestStatusType, message: str = "Job started") -> str:
        job_id = f"job_{job_type.value}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        status = RequestStatus(
            job_id=job_id,
            type=job_type,
            status=JobStatus.RUNNING,
            message=message
        )
        db = storage.get_db()
        
        # FIX 1: Change "if db:" to "if db is not None:"
        if db is not None:
            await db.jobs.insert_one(status.dict())
        return job_id

    async def update_job(self, job_id: str, status: Optional[JobStatus] = None, progress: Optional[float] = None, message: Optional[str] = None, error: Optional[str] = None, result: Optional[Any] = None):
        db = storage.get_db()
        
        # FIX 2: Change "if not db:" to "if db is None:"
        if db is None: 
            return
        
        update_data = {"updated_at": datetime.utcnow()}
        if status: update_data["status"] = status
        if progress is not None: update_data["progress"] = progress
        if message: update_data["message"] = message
        if error: update_data["error"] = error
        if result: update_data["result"] = result
        
        await db.jobs.update_one({"job_id": job_id}, {"$set": update_data})

    async def get_job(self, job_id: str) -> Optional[Dict]:
        db = storage.get_db()
        
        # FIX 3: Change "if not db:" to "if db is None:"
        if db is None: 
            return None
            
        return await db.jobs.find_one({"job_id": job_id}, {"_id": 0})

job_manager = JobManager()