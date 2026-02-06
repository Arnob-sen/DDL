from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from .storage.db import storage
from .api import indexing, projects, answers, jobs

load_dotenv()

app = FastAPI(title="Questionnaire Agent API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
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

# Mount API Routers
app.include_router(indexing.router)
app.include_router(projects.router)
app.include_router(answers.router)
app.include_router(jobs.router)

# Legacy Root Mounts (Optional, for backward compatibility if needed)
# app.include_router(indexing.router, prefix="")
# app.include_router(projects.router, prefix="")
# app.include_router(answers.router, prefix="")
# app.include_router(jobs.router, prefix="")

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
