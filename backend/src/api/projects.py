from fastapi import APIRouter, BackgroundTasks, HTTPException
from typing import Optional, List
from datetime import datetime
from ..storage.db import storage
from ..workers.manager import job_manager
from ..workers.tasks import create_project_async_task
from ..models.models import RequestStatusType, JobStatus, ProjectStatus
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["projects"])

class CreateProjectPayload(BaseModel):
    name: str
    questionnaire_path: str
    scope: Optional[str] = "ALL_DOCS"

class UpdateProjectPayload(BaseModel):
    project_id: str
    name: Optional[str] = None
    scope: Optional[str] = None
    trigger_regeneration: Optional[bool] = False

@router.post("/create-project-async")
async def create_project_async(background_tasks: BackgroundTasks, payload: CreateProjectPayload):
    name = payload.name
    q_path = payload.questionnaire_path
    scope = payload.scope
    
    if not name or not q_path:
        raise HTTPException(status_code=400, detail="Name and questionnaire_path are required")
        
    job_id = await job_manager.create_job(RequestStatusType.PROJECT_CREATION)
    background_tasks.add_task(create_project_async_task, job_id, name, q_path, scope)
    return {"job_id": job_id, "status": JobStatus.RUNNING}

@router.post("/resume-project-generation/{project_id}")
async def resume_project_generation(project_id: str, background_tasks: BackgroundTasks, force: bool = False):
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # If project is outdated, we likely want to force regenerate
    should_force = force or project.get("status") == ProjectStatus.OUTDATED
    
    job_id = await job_manager.create_job(RequestStatusType.PROJECT_CREATION, message="Starting answer regeneration..." if should_force else "Resuming generation...")
    # Passing empty q_path because it's already in DB, create_project_async_task handles this via project_id
    background_tasks.add_task(create_project_async_task, job_id, project["name"], "", project["document_scope"], project_id, should_force)
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

@router.get("/projects")
async def list_projects():
    db = storage.get_db()
    projects = await db.projects.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    
    # Enrich with counts
    enriched_projects = []
    for project in projects:
        p_id = project["id"]
        q_count = await db.questions.count_documents({"project_id": p_id})
        a_count = await db.answers.count_documents({"project_id": p_id})
        
        project["question_count"] = q_count
        project["answered_count"] = a_count
        
        # Latest job error if FAILED
        if project["status"] == ProjectStatus.FAILED:
            latest_job = await db.jobs.find_one(
                {"result.project_id": p_id}, 
                sort=[("created_at", -1)]
            )
            if latest_job and latest_job.get("error"):
                project["last_error"] = latest_job["error"]

        enriched_projects.append(project)
        
    return enriched_projects

@router.get("/get-project-status/{project_id}")
async def get_project_status(project_id: str):
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "status": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/update-project-async")
async def update_project_async(background_tasks: BackgroundTasks, payload: UpdateProjectPayload):
    project_id = payload.project_id
    
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updates = {}
    if payload.name: updates["name"] = payload.name
    if payload.scope: updates["document_scope"] = payload.scope
    
    if updates:
        updates["updated_at"] = datetime.utcnow()
        await db.projects.update_one({"id": project_id}, {"$set": updates})
        
        # If scope changed, trigger re-generation of all answers (or just mark as outdated)
        if payload.scope:
            await db.projects.update_one({"id": project_id}, {"$set": {"status": ProjectStatus.OUTDATED}})
            # Trigger background task to regenerate if requested
            if payload.trigger_regeneration:
                job_id = await job_manager.create_job(RequestStatusType.PROJECT_UPDATE, message="Updating project and regenerating answers...")
                background_tasks.add_task(create_project_async_task, job_id, project["name"], "", payload.scope, project_id)
                return {"job_id": job_id, "message": "Project updated and regeneration started"}

    return {"message": "Project updated successfully"}
