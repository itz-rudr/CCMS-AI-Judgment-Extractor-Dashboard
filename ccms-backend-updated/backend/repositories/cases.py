import logging
from typing import List, Dict, Optional, Any
from fastapi import HTTPException
from backend.db import get_supabase

logger = logging.getLogger(__name__)

# Hybrid Storage: In-memory fallback for when DB is offline/misconfigured
# This ensures "Upload -> Extraction -> Visibility" works in all conditions.
IN_MEMORY_CASES: List[Dict[str, Any]] = []

def get_all_cases(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Retrieve all cases with pagination.
    
    Args:
        skip (int): The number of records to skip.
        limit (int): The maximum number of records to return.
        
    Returns:
        List[Dict[str, Any]]: A list of cases.
    """
    try:
        client = get_supabase()
        response = client.table("cases").select("*").range(skip, skip + limit - 1).execute()
        db_cases = response.data or []
        
        # Merge with in-memory cases (latest first)
        all_cases = IN_MEMORY_CASES + db_cases
        return all_cases[skip : skip + limit]
    except Exception as e:
        logger.error(f"Error retrieving cases: {e}")
        # Fallback to just memory if DB logic fails completely
        return IN_MEMORY_CASES[skip : skip + limit]

def get_case_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a specific case by its ID.
    
    Args:
        case_id (str): The ID of the case.
        
    Returns:
        Optional[Dict[str, Any]]: The case data if found, else None.
    """
    try:
        # Check memory first
        for case in IN_MEMORY_CASES:
            if str(case.get("id")) == str(case_id):
                return case
                
        client = get_supabase()
        response = client.table("cases").select("*").eq("id", case_id).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        logger.error(f"Error retrieving case {case_id}: {e}")
        return None
