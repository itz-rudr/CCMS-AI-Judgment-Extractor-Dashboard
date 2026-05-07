from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from backend.db import get_supabase
from backend.services.formatter import format_case

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def list_extractions():
    """
    Retrieve all extractions formatted for the frontend queue.
    """
    try:
        db = get_supabase()
        response = db.table("cases").select("*, actions(*)").order("created_at", desc=True).execute()
        
        formatted_cases = []
        for case in response.data:
            formatted_cases.append(format_case(case))
            
        return formatted_cases
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/{case_id}", response_model=Dict[str, Any])
async def get_extraction(case_id: str):
    """
    Retrieve a specific extraction by its ID.
    """
    try:
        db = get_supabase()
        response = db.table("cases").select("*, actions(*)").eq("id", case_id).limit(1).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case {case_id} not found"
            )
            
        return format_case(response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
