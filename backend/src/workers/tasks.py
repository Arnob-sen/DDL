import os
from datetime import datetime
from typing import Optional
from ..storage.db import storage
from ..models.models import ProjectStatus, JobStatus, Project
from ..indexing.pipeline import indexing_pipeline
from ..services.generation import generation_service
from ..services.parser import questionnaire_parser
from ..workers.manager import job_manager

def format_api_error(e: Exception) -> str:
    error_msg = str(e)
    if "RESOURCE_EXHAUSTED" in error_msg:
        return "Google API Quota Reached. Please wait a few minutes and try again."
    elif "429" in error_msg:
        return "Rate limit exceeded. slowing down..."
    return error_msg

async def index_document_async_task(job_id: str, file_path: str, doc_name: str):
    try:
        await job_manager.update_job(job_id, status=JobStatus.RUNNING, message="Chunking and indexing...")
        chunks_count = await indexing_pipeline.index_document(file_path, doc_name)
        
        # Mark ALL_DOCS projects as OUTDATED
        db = storage.get_db()

        # Record document in DB
        await db.documents.insert_one({
            "name": doc_name,
            "filename": os.path.basename(file_path),
            "status": "INDEXED",
            "chunks_count": chunks_count,
            "indexed_at": datetime.utcnow()
        })

        await db.projects.update_many(
            {"document_scope": "ALL_DOCS", "status": ProjectStatus.COMPLETED},
            {"$set": {"status": ProjectStatus.OUTDATED, "updated_at": datetime.utcnow()}}
        )
        
        await job_manager.update_job(job_id, status=JobStatus.COMPLETED, message="Indexing complete. Projects synced.")
    except Exception as e:
        await job_manager.update_job(job_id, status=JobStatus.FAILED, error=str(e))

async def create_project_async_task(job_id: str, name: str, questionnaire_path: str, scope: str, project_id: Optional[str] = None, force_regenerate: bool = False):
    try:
        db = storage.get_db()
        
        # 1. Create or Get Project Entry
        if not project_id:
            project = Project(name=name, questionnaire_filename=os.path.basename(questionnaire_path), document_scope=scope)
            await db.projects.insert_one(project.dict())
            project_id = project.id
            # Record project_id in job early for recovery
            await job_manager.update_job(job_id, result={"project_id": project_id})
            
            # 2. Parse Questions (Only if new project)
            await job_manager.update_job(job_id, status=JobStatus.RUNNING, message="Parsing questionnaire...")
            questions = questionnaire_parser.parse(questionnaire_path, project_id)
            if questions:
                await db.questions.insert_many([q.dict() for q in questions])
        else:
            await job_manager.update_job(job_id, status=JobStatus.RUNNING, message="Resuming project generation...", result={"project_id": project_id})
            if force_regenerate:
                await db.projects.update_one({"id": project_id}, {"$set": {"status": ProjectStatus.READY}})

        # 3. Trigger Generation (Internal helper)
        await generate_answers_for_project(job_id, project_id, force_regenerate)
        
    except Exception as e:
        await job_manager.update_job(job_id, status=JobStatus.FAILED, error=str(e))
        # Update project status to FAILED so UI knows it stopped
        if project_id:
            db = storage.get_db()
            await db.projects.update_one({"id": project_id}, {"$set": {"status": ProjectStatus.FAILED, "updated_at": datetime.utcnow()}})

async def generate_answers_for_project(job_id: str, project_id: str, force_regenerate: bool = False):
    db = storage.get_db()
    
    # Load Questions
    questions = await db.questions.find({"project_id": project_id}).to_list(1000)
    
    # Parse Project scope
    project = await db.projects.find_one({"id": project_id})
    scope = project.get("document_scope", "ALL_DOCS")

    # If force, clear existing answers first
    if force_regenerate:
        await job_manager.update_job(job_id, message="Clearing previous answers for fresh regeneration...")
        await db.answers.delete_many({"project_id": project_id})
        # Reset questions status if needed, though generate_answer will overwrite anyway
        await db.questions.update_many({"project_id": project_id}, {"$set": {"status": "PENDING"}})

    # Trigger Answer Generation
    for i, question in enumerate(questions):
        # Check if answer already exists (if not forced)
        if not force_regenerate:
            existing_answer = await db.answers.find_one({"question_id": question["id"]})
            if existing_answer:
                continue

        await job_manager.update_job(job_id, progress=0.1 + (0.9 * (i/len(questions))), message=f"Generating answer {i+1}/{len(questions)}...")
        try:
            answer = await generation_service.generate_answer(project_id, question["id"], question["text"], collection_name=scope)
            await db.answers.insert_one(answer.dict())
            # Update question status to reflect it's been processed
            await db.questions.update_one({"id": question["id"]}, {"$set": {"status": "AI_GENERATED"}})
        except Exception as e:
            print(f"Error generating answer for {question['id']}: {e}")
            continue
        
    await db.projects.update_one({"id": project_id}, {"$set": {"status": ProjectStatus.COMPLETED, "updated_at": datetime.utcnow()}})
    await job_manager.update_job(job_id, status=JobStatus.COMPLETED, message="Project processing complete.", result={"project_id": project_id})

async def generate_single_answer_task(job_id: str, project_id: str, question_id: str, question_text: str, scope: str = "ALL_DOCS"):
    try:
        db = storage.get_db()
        await job_manager.update_job(job_id, status=JobStatus.RUNNING, message=f"Generating answer for question {question_id}...")
        
        answer = await generation_service.generate_answer(project_id, question_id, question_text, collection_name=scope)
        
        # Upsert answer
        await db.answers.update_one(
            {"question_id": question_id},
            {"$set": answer.dict()},
            upsert=True
        )
        
        await job_manager.update_job(job_id, status=JobStatus.COMPLETED, message="Answer generated.", result={"question_id": question_id})
    except Exception as e:
        await job_manager.update_job(job_id, status=JobStatus.FAILED, error=str(e))

