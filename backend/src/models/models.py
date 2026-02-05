from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    OUTDATED = "OUTDATED"
    FAILED = "FAILED"

class AnswerStatus(str, Enum):
    PENDING = "PENDING"
    AI_GENERATED = "AI_GENERATED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    MANUAL_UPDATED = "MANUAL_UPDATED"
    MISSING_DATA = "MISSING_DATA"

class RequestStatusType(str, Enum):
    INDEXING = "INDEXING"
    PROJECT_CREATION = "PROJECT_CREATION"
    ANSWER_GENERATION = "ANSWER_GENERATION"
    PROJECT_UPDATE = "PROJECT_UPDATE"

class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Citation(BaseModel):
    document_name: str
    text_snippet: str
    page_number: Optional[int] = None
    confidence: float = 0.0

class Answer(BaseModel):
    id: str = Field(default_factory=lambda: "ans_" + datetime.now().strftime("%Y%m%d%H%M%S"))
    question_id: str
    project_id: str
    answer_text: Optional[str] = None
    is_answerable: bool = True
    citations: List[Citation] = []
    confidence_score: float = 0.0
    status: AnswerStatus = AnswerStatus.PENDING
    manual_overridden_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Question(BaseModel):
    id: str
    project_id: str
    section: str
    text: str
    order: int

class Project(BaseModel):
    id: str = Field(default_factory=lambda: "proj_" + datetime.now().strftime("%Y%m%d%H%M%S"))
    name: str
    questionnaire_filename: str
    document_scope: str = "ALL_DOCS" # or list of doc IDs
    status: ProjectStatus = ProjectStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RequestStatus(BaseModel):
    job_id: str
    type: RequestStatusType
    status: JobStatus = JobStatus.PENDING
    progress: float = 0.0
    message: Optional[str] = None
    error: Optional[str] = None
    result: Optional[Dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
