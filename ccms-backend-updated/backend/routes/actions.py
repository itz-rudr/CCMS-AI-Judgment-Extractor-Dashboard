from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body, status, Query
from pydantic import BaseModel, Field
import logging

from backend.repositories.actions import update_action_status

logger = logging.getLogger(__name__)

router = APIRouter()

class ActionUpdateRequest(BaseModel):
    status: str = Field(..., description="The new status to apply, e.g., 'approved' or 'rejected'")
    updated_by: str = Field("system_user", description="The user performing the update")
    comments: str = Field("", description="Comments explaining the status change")
    limitation_period: str = Field(None, description="Optional limitation period update")

@router.patch("/{action_id}", response_model=Dict[str, Any])
async def update_action(
    action_id: str,
    update_data: ActionUpdateRequest = Body(...),
    role: str = Query("officer", description="User role. JWT auth to be added in production")
):
    """
    Update the status of an action (e.g. approve/reject workflow).
    Writes to audit_logs table via the repository layer.
    """
    logger.info(f"PATCH /actions/{action_id} requested by role={role}")
    if role not in ["officer", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only officers and admins can edit.")
        
    if update_data.status not in ["approved", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid status value", "code": "INVALID_STATUS", "status": 400}
        )
        
    try:
        updated_action = update_action_status(
            action_id=action_id,
            status=update_data.status,
            updated_by=update_data.updated_by,
            comments=update_data.comments,
            limitation_period=update_data.limitation_period
        )
        return updated_action
        
    except HTTPException as he:
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

@router.post("/{action_id}/approve", response_model=Dict[str, Any])
async def approve_action(
    action_id: str,
    role: str = Query("officer", description="User role. JWT auth to be added in production")
):
    """Approve an action (judge only)."""
    logger.info(f"POST /actions/{action_id}/approve requested by role={role}")
    if role != "judge":
        raise HTTPException(status_code=403, detail="Forbidden. Only judges can approve.")
    try:
        updated_action = update_action_status(
            action_id=action_id,
            status="approved",
            updated_by=f"user_{role}",
            comments="Approved by Judge"
        )
        return updated_action
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{action_id}/reject", response_model=Dict[str, Any])
async def reject_action(
    action_id: str,
    role: str = Query("officer", description="User role. JWT auth to be added in production")
):
    """Reject an action (judge only)."""
    logger.info(f"POST /actions/{action_id}/reject requested by role={role}")
    if role != "judge":
        raise HTTPException(status_code=403, detail="Forbidden. Only judges can reject.")
    try:
        updated_action = update_action_status(
            action_id=action_id,
            status="rejected",
            updated_by=f"user_{role}",
            comments="Rejected by Judge"
        )
        return updated_action
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
