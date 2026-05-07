from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

import logging

from backend.repositories.cases import get_all_cases, get_case_by_id
from backend.repositories.actions import get_actions_by_case

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def list_cases(
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return", le=100),
    role: str = Query("officer", description="User role. JWT auth to be added in production")
):
    """
    Retrieve all cases with pagination.
    """
    try:
        logger.info(f"GET /cases requested by role={role}")
        cases = get_all_cases(skip=skip, limit=limit)
        
        if role == "judge":
            for case in cases:
                case.pop("bounding_box", None)
                if "actions" in case:
                    for action in case["actions"]:
                        action.pop("bounding_box", None)
                        
        return cases
    except HTTPException as he:
        # Repackage exception to match API error format if necessary, though repo might already do it
        if isinstance(he.detail, dict) and "error" in he.detail:
            raise he
        raise HTTPException(
            status_code=he.status_code,
            detail={"error": str(he.detail), "code": "DB_ERROR", "status": he.status_code}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "INTERNAL_ERROR", "status": 500}
        )

@router.get("/{case_id}", response_model=Dict[str, Any])
async def get_case(case_id: str):
    """
    Retrieve a specific case by its ID.
    """
    try:
        case = get_case_by_id(case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": f"Case {case_id} not found", "code": "CASE_NOT_FOUND", "status": 404}
            )
        return case
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "INTERNAL_ERROR", "status": 500}
        )

@router.get("/{case_id}/actions", response_model=List[Dict[str, Any]])
async def get_case_actions(
    case_id: str,
    role: str = Query("officer", description="User role. JWT auth to be added in production")
):
    """
    Retrieve all actions associated with a specific case.
    Ensures bounding boxes are flattened as [x0, y0, x1, y1].
    """
    try:
        logger.info(f"GET /cases/{case_id}/actions requested by role={role}")
        # First check if case exists
        case = get_case_by_id(case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": f"Case {case_id} not found", "code": "CASE_NOT_FOUND", "status": 404}
            )
            
        actions = get_actions_by_case(case_id)
        
        # Format bounding boxes if they exist
        formatted_actions = []
        for action in actions:
            if role == "judge":
                action.pop("bounding_box", None)
                action.pop("bbox_page", None)
                action.pop("bbox_x0", None)
                action.pop("bbox_y0", None)
                action.pop("bbox_x1", None)
                action.pop("bbox_y1", None)
            else:
                # Depending on DB schema, bounding_box might be JSON/dict or list
                bbox = action.get("bounding_box")
                if bbox and isinstance(bbox, dict) and all(k in bbox for k in ("x0", "y0", "x1", "y1")):
                    action["bounding_box"] = [bbox["x0"], bbox["y0"], bbox["x1"], bbox["y1"]]
            formatted_actions.append(action)
            
        return formatted_actions
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "INTERNAL_ERROR", "status": 500}
        )
