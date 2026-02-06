import os
from fastapi import APIRouter, BackgroundTasks, HTTPException
from ..workers.manager import job_manager
from ..workers.tasks import index_document_async_task
from ..models.models import RequestStatusType, JobStatus

router = APIRouter(tags=["indexing"])

@router.post("/index-document-async")
async def index_document_async(background_tasks: BackgroundTasks, payload: dict):
    file_path = payload.get("file_path")
    doc_name = payload.get("doc_name")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Valid file_path is required")
    
    job_id = await job_manager.create_job(RequestStatusType.INDEXING)
    background_tasks.add_task(index_document_async_task, job_id, file_path, doc_name)
    return {"job_id": job_id, "status": JobStatus.RUNNING}

# Supporting legacy root-level endpoint if needed, but we'll mount it in main.py
