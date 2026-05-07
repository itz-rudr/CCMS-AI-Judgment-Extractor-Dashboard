from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    result: Optional[Any] = None

# In-memory store for background job tracking
JOBS: Dict[str, JobStatus] = {}

@router.get("/{job_id}", response_model=JobStatus)
async def get_job(job_id: str):
    """
    Retrieve the status of a background job.
    """
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Job {job_id} not found", "code": "JOB_NOT_FOUND", "status": 404}
        )
    return job
