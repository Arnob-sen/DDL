from fastapi import APIRouter, BackgroundTasks, HTTPException
from datetime import datetime
from ..storage.db import storage
from ..workers.manager import job_manager
from ..workers.tasks import generate_single_answer_task, generate_answers_for_project
from ..models.models import RequestStatusType, JobStatus, AnswerStatus

router = APIRouter(tags=["answers"])

@router.post("/generate-single-answer")
async def generate_single_answer(background_tasks: BackgroundTasks, payload: dict):
    project_id = payload.get("project_id")
    question_id = payload.get("question_id")
    
    if not project_id or not question_id:
        raise HTTPException(status_code=400, detail="project_id and question_id are required")
        
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    question = await db.questions.find_one({"id": question_id, "project_id": project_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    job_id = await job_manager.create_job(RequestStatusType.ANSWER_GENERATION, message="Generating single answer...")
    background_tasks.add_task(
        generate_single_answer_task, 
        job_id, 
        project_id, 
        question_id, 
        question["text"], 
        project.get("document_scope", "ALL_DOCS")
    )
    return {"job_id": job_id, "status": JobStatus.RUNNING}

@router.post("/generate-all-answers")
async def generate_all_answers(background_tasks: BackgroundTasks, payload: dict):
    project_id = payload.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
        
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    job_id = await job_manager.create_job(RequestStatusType.ANSWER_GENERATION, message="Generating all missing answers...")
    background_tasks.add_task(generate_answers_for_project, job_id, project_id)
    return {"job_id": job_id, "status": JobStatus.RUNNING}

@router.post("/update-answer")
async def update_answer(payload: dict):
    answer_id = payload.get("answer_id")
    project_id = payload.get("project_id")
    question_id = payload.get("question_id")
    
    db = storage.get_db()
    
    if answer_id:
        answer = await db.answers.find_one({"id": answer_id})
    elif project_id and question_id:
        answer = await db.answers.find_one({"project_id": project_id, "question_id": question_id})
    else:
        raise HTTPException(status_code=400, detail="answer_id or (project_id and question_id) are required")
        
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
        
    updates = {
        "updated_at": datetime.utcnow()
    }
    
    # Handle both payload keys for flexibility
    new_text = payload.get("answer_text") or payload.get("answer")
    
    if new_text:
        updates["answer_text"] = new_text
        updates["manual_overridden_text"] = new_text
        updates["status"] = AnswerStatus.MANUAL_UPDATED
        
    if "status" in payload:
        updates["status"] = AnswerStatus(payload["status"])
        
    await db.answers.update_one({"_id": answer["_id"]}, {"$set": updates})
    return {"message": "Answer updated successfully"}
