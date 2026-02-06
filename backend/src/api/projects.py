from fastapi import APIRouter, BackgroundTasks, HTTPException
from datetime import datetime
from ..storage.db import storage
from ..workers.manager import job_manager
from ..workers.tasks import create_project_async_task
from ..models.models import RequestStatusType, JobStatus, ProjectStatus

router = APIRouter(tags=["projects"])

@router.post("/create-project-async")
async def create_project_async(background_tasks: BackgroundTasks, payload: dict):
    name = payload.get("name")
    q_path = payload.get("questionnaire_path")
    scope = payload.get("scope", "ALL_DOCS")
    
    if not name or not q_path:
        raise HTTPException(status_code=400, detail="Name and questionnaire_path are required")
        
    job_id = await job_manager.create_job(RequestStatusType.PROJECT_CREATION)
    background_tasks.add_task(create_project_async_task, job_id, name, q_path, scope)
    return {"job_id": job_id, "status": JobStatus.RUNNING}

@router.post("/resume-project-generation/{project_id}")
async def resume_project_generation(project_id: str, background_tasks: BackgroundTasks):
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    job_id = await job_manager.create_job(RequestStatusType.PROJECT_CREATION, message="Resuming generation...")
    # Passing empty q_path because it's already in DB, create_project_async_task handles this via project_id
    background_tasks.add_task(create_project_async_task, job_id, project["name"], "", project["document_scope"], project_id)
    return {"job_id": job_id, "status": JobStatus.PENDING}

@router.get("/get-project-info/{project_id}")
async def get_project_info(project_id: str):
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    questions = await db.questions.find({"project_id": project_id}, {"_id": 0}).sort("order", 1).to_list(1000)
    answers = await db.answers.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    
    return {
        "project": project,
        "questions": questions,
        "answers": answers
    }

@router.get("/get-project-status/{project_id}")
async def get_project_status(project_id: str):
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "status": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/update-project-async")
async def update_project_async(background_tasks: BackgroundTasks, payload: dict):
    project_id = payload.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updates = {}
    if "name" in payload: updates["name"] = payload["name"]
    if "scope" in payload: updates["document_scope"] = payload["scope"]
    
    if updates:
        updates["updated_at"] = datetime.utcnow()
        await db.projects.update_one({"id": project_id}, {"$set": updates})
        
        # If scope changed, trigger re-generation of all answers (or just mark as outdated)
        if "scope" in payload:
            await db.projects.update_one({"id": project_id}, {"$set": {"status": ProjectStatus.OUTDATED}})
            # Trigger background task to regenerate if requested
            if payload.get("trigger_regeneration", False):
                job_id = await job_manager.create_job(RequestStatusType.PROJECT_UPDATE, message="Updating project and regenerating answers...")
                background_tasks.add_task(create_project_async_task, job_id, project["name"], "", payload["scope"], project_id)
                return {"job_id": job_id, "message": "Project updated and regeneration started"}

    return {"message": "Project updated successfully"}
