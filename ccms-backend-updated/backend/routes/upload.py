import uuid
import os
import tempfile
import logging
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, HTTPException, status, Query
from backend.routes.jobs import JOBS, JobStatus
from backend.repositories.cases import IN_MEMORY_CASES
import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

async def process_document(job_id: str, file_path: str, language: str = "English"):
    """
    Background task to process the uploaded PDF, extract text, and run AI analysis.
    """
    try:
        JOBS[job_id].status = "Extracting text..."
        JOBS[job_id].progress = 10
        
        # Extract text using PyMuPDF (fast path)
        from backend.services.pdf_parser import extract_text_pymupdf
        text, valid = extract_text_pymupdf(file_path)
        
        if not valid:
            JOBS[job_id].status = "Running OCR..."
            JOBS[job_id].progress = 30
            # If we had Tesseract OCR fallback, it would be called here.
            # Assuming text is extracted regardless for the hackathon MVP.

        JOBS[job_id].status = "Analyzing with AI..."
        JOBS[job_id].progress = 50
        
        from backend.services.ai_extractor import chunk_and_extract
        logger.info(f"Extracting with output_language={language}")
        extracted_case = await chunk_and_extract(text, output_language=language)
        
        JOBS[job_id].status = "Saving to database..."
        JOBS[job_id].progress = 80
        
        from backend.db import get_supabase
        db = get_supabase()
        
        # 1. Insert Case (Best effort storage)
        case_data = {
            "case_number": extracted_case.case_number,
            "parties_involved": extracted_case.parties_involved,
            "judge_name": extracted_case.judge_name,
            "next_hearing_date": extracted_case.next_hearing_date,
            "legal_sections": extracted_case.legal_sections,
            "summary": extracted_case.summary,
            "pdf_url": file_path
        }
        
        case_id = None
        try:
            case_res = db.table("cases").insert(case_data).execute()
            if case_res.data:
                case_id = case_res.data[0]["id"]
                
                # 2. Insert Actions
                if extracted_case.actions:
                    actions_data = []
                    for action in extracted_case.actions:
                        actions_data.append({
                            "case_id": case_id,
                            "department": action.department,
                            "action_required": action.action_required,
                            "deadline": action.deadline,
                            "priority": action.priority,
                            "confidence_score": action.confidence_score,
                            "status": "pending"
                        })
                    db.table("actions").insert(actions_data).execute()
            else:
                logger.warning("Database insert returned no data - check table permissions/key.")
        except Exception as db_err:
            logger.error(f"DATABASE PERSISTENCE FAILED (Job {job_id}): {db_err}")
            # SAVE TO MEMORY FALLBACK
            import uuid
            mem_id = f"mem_{uuid.uuid4().hex[:8]}"
            case_data["id"] = mem_id
            case_data["created_at"] = datetime.datetime.now().isoformat()
            
            # Format actions for memory
            mem_actions = []
            if extracted_case.actions:
                for action in extracted_case.actions:
                    mem_actions.append({
                        "id": f"act_{uuid.uuid4().hex[:6]}",
                        "case_id": mem_id,
                        "department": action.department,
                        "action_required": action.action_required,
                        "deadline": action.deadline,
                        "priority": action.priority,
                        "confidence_score": action.confidence_score,
                        "status": "pending"
                    })
            case_data["actions"] = mem_actions
            IN_MEMORY_CASES.insert(0, case_data)
            logger.info(f"Case {case_data['case_number']} saved to IN_MEMORY_STORE.")
        
        JOBS[job_id].status = "Done" if case_id else "Done (Session Storage)"
        JOBS[job_id].progress = 100
        JOBS[job_id].result = extracted_case.model_dump()
        
    except Exception as e:
        logger.error(f"Error processing document for job {job_id}: {e}")
        JOBS[job_id].status = f"Failed: {str(e)}"
    finally:
        # Clean up temporary file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as cleanup_error:
                logger.error(f"Failed to remove temp file {file_path}: {cleanup_error}")

@router.post("/", status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    language: str = Query("English", enum=["English", "Hindi", "Kannada"])
):
    """
    Upload a document for processing. Triggers extraction via background tasks.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Only PDF files are supported", "code": "INVALID_FILE_TYPE", "status": 400}
        )
        
    job_id = str(uuid.uuid4())
    JOBS[job_id] = JobStatus(job_id=job_id, status="Extracting text...", progress=0)
    
    try:
        # Save file temporarily to disk to avoid keeping large PDFs in memory
        fd, path = tempfile.mkstemp(suffix=".pdf")
        with os.fdopen(fd, 'wb') as f:
            content = await file.read()
            f.write(content)
            
        background_tasks.add_task(process_document, job_id, path, language)
        return {"job_id": job_id, "status": "processing"}
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "UPLOAD_FAILED", "status": 500}
        )
