import logging
from typing import List, Dict, Any
from fastapi import HTTPException
from backend.db import get_supabase

logger = logging.getLogger(__name__)

def get_actions_by_case(case_id: str) -> List[Dict[str, Any]]:
    """
    Retrieve all actions associated with a specific case.
    
    Args:
        case_id (str): The ID of the case.
        
    Returns:
        List[Dict[str, Any]]: A list of actions for the case.
    """
    try:
        client = get_supabase()
        response = client.table("actions").select("*").eq("case_id", case_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error retrieving actions for case {case_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred while retrieving actions.")

def update_action_status(action_id: str, status: str, updated_by: str, comments: str, limitation_period: str = None) -> Dict[str, Any]:
    """
    Update the status of an action and write an audit log entry.
    
    Args:
        action_id (str): The ID of the action.
        status (str): The new status to apply.
        updated_by (str): The user performing the update.
        comments (str): Comments explaining the status change.
        limitation_period (str, optional): The limitation period if provided.
        
    Returns:
        Dict[str, Any]: The updated action data.
    """
    try:
        client = get_supabase()
        
        # 1. Fetch the previous state
        prev_response = client.table("actions").select("status").eq("id", action_id).limit(1).execute()
        if not prev_response.data:
            raise HTTPException(status_code=404, detail=f"Action {action_id} not found.")
        
        previous_state = prev_response.data[0].get("status")
        
        # 2. Update the action status
        update_data = {"status": status}
        if limitation_period is not None:
            update_data["limitation_period"] = limitation_period
            
        update_response = client.table("actions").update(update_data).eq("id", action_id).execute()
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update action status.")
            
        updated_action = update_response.data[0]
        
        # 3. Write to audit_logs
        audit_log = {
            "table_name": "actions",
            "record_id": action_id,
            "action_type": "UPDATE_STATUS",
            "previous_state": {"status": previous_state},
            "new_state": {"status": status},
            "updated_by": updated_by,
            "comments": comments
        }
        
        client.table("audit_logs").insert(audit_log).execute()
        
        return updated_action
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating action {action_id} status: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred while updating action status.")
