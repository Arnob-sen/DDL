from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv

from .storage.db import storage
from .models.models import ProjectStatus, RequestStatusType, JobStatus, RequestStatus, Project, Question, AnswerStatus
from .indexing.pipeline import indexing_pipeline
from .services.generation import generation_service
from .services.parser import questionnaire_parser
from .workers.manager import job_manager

load_dotenv()

app = FastAPI(title="Questionnaire Agent API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await storage.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    await storage.disconnect()

@app.get("/health")
async def health_check():
    return await storage.health_check()

# --- Background Tasks ---

async def index_document_async_task(job_id: str, file_path: str, doc_name: str):
    try:
        await job_manager.update_job(job_id, status=JobStatus.RUNNING, message="Chunking and indexing...")
        await indexing_pipeline.index_document(file_path, doc_name)
        
        # Mark ALL_DOCS projects as OUTDATED
        db = storage.get_db()
        await db.projects.update_many(
            {"document_scope": "ALL_DOCS", "status": ProjectStatus.COMPLETED},
            {"$set": {"status": ProjectStatus.OUTDATED, "updated_at": datetime.utcnow()}}
        )
        
        await job_manager.update_job(job_id, status=JobStatus.COMPLETED, message="Indexing complete. Projects synced.")
    except Exception as e:
        await job_manager.update_job(job_id, status=JobStatus.FAILED, error=str(e))

async def create_project_async_task(job_id: str, name: str, questionnaire_path: str, scope: str):
    try:
        await job_manager.update_job(job_id, status=JobStatus.RUNNING, message="Parsing questionnaire...")
        
        # 1. Create Project Entry
        project = Project(name=name, questionnaire_filename=os.path.basename(questionnaire_path), document_scope=scope)
        db = storage.get_db()
        await db.projects.insert_one(project.dict())
        
        # 2. Parse Questions
        questions = questionnaire_parser.parse(questionnaire_path, project.id)
        if questions:
            await db.questions.insert_many([q.dict() for q in questions])
        
        await job_manager.update_job(job_id, progress=0.5, message=f"Parsed {len(questions)} questions. Starting generation...")
        
        # 3. Trigger Answer Generation
        for i, question in enumerate(questions):
            await job_manager.update_job(job_id, progress=0.5 + (0.5 * (i/len(questions))), message=f"Generating answer {i+1}/{len(questions)}...")
            answer = await generation_service.generate_answer(project.id, question.id, question.text)
            await db.answers.insert_one(answer.dict())
            
        await db.projects.update_one({"id": project.id}, {"$set": {"status": ProjectStatus.COMPLETED, "updated_at": datetime.utcnow()}})
        await job_manager.update_job(job_id, status=JobStatus.COMPLETED, message="Project created and answers generated.", result={"project_id": project.id})
        
    except Exception as e:
        await job_manager.update_job(job_id, status=JobStatus.FAILED, error=str(e))

# --- Endpoints ---

@app.post("/index-document-async")
async def index_document_async(background_tasks: BackgroundTasks, payload: dict):
    file_path = payload.get("file_path")
    doc_name = payload.get("doc_name")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Valid file_path is required")
    
    job_id = await job_manager.create_job(RequestStatusType.INDEXING)
    background_tasks.add_task(index_document_async_task, job_id, file_path, doc_name)
    return {"job_id": job_id, "status": JobStatus.PENDING}

@app.post("/create-project-async")
async def create_project_async(background_tasks: BackgroundTasks, payload: dict):
    name = payload.get("name")
    q_path = payload.get("questionnaire_path")
    scope = payload.get("scope", "ALL_DOCS")
    
    if not name or not q_path or not os.path.exists(q_path):
        raise HTTPException(status_code=400, detail="Name and valid questionnaire_path are required")
        
    job_id = await job_manager.create_job(RequestStatusType.PROJECT_CREATION)
    background_tasks.add_task(create_project_async_task, job_id, name, q_path, scope)
    return {"job_id": job_id, "status": JobStatus.PENDING}

@app.get("/get-project-info/{project_id}")
async def get_project_info(project_id: str):
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    questions = await db.questions.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    answers = await db.answers.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    
    return {
        "project": project,
        "questions": questions,
        "answers": answers
    }

@app.get("/get-project-status/{project_id}")
async def get_project_status(project_id: str):
    db = storage.get_db()
    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "status": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/get-request-status/{job_id}")
async def get_request_status(job_id: str):
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
