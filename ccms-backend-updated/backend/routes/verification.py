from fastapi import APIRouter, HTTPException, Body, status
from typing import Dict, Any
from backend.db import get_supabase
from backend.services.formatter import format_case

router = APIRouter()

@router.post("/{case_id}", response_model=Dict[str, Any])
async def verify_case(
    case_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Verify a case (Approve/Reject/Edit).
    Updates all nested actions to the specified status and updates the case metadata.
    """
    try:
        db = get_supabase()
        
        # 1. Extract decision and fields from frontend payload
        decision = payload.get("decision", "").lower()
        if decision == "needs review":
            decision = "pending"
            
        fields = payload.get("fields", {})
        
        # 2. If it's an Edit, we can update the case table with the basic fields
        if fields:
            case_update = {}
            if "cisId" in fields: case_update["case_number"] = fields["cisId"]
            if "title" in fields: case_update["parties_involved"] = fields["title"]
            if "bench" in fields: case_update["judge_name"] = fields["bench"]
            if "actionSummary" in fields: case_update["summary"] = fields["actionSummary"]
            
            if case_update:
                db.table("cases").update(case_update).eq("id", case_id).execute()
        
        # 3. Update all actions associated with this case
        if decision in ["approved", "rejected", "pending"]:
            db.table("actions").update({"status": decision}).eq("case_id", case_id).execute()
            
            # Log to audit_logs (previous_state / new_state must be JSONB)
            db.table("audit_logs").insert({
                "table_name": "cases",
                "record_id": case_id,
                "action_type": decision.title(),
                "previous_state": {"status": "unknown"},
                "new_state": {"status": decision},
                "updated_by": "reviewer",
                "comments": f"Case {decision}"
            }).execute()

        # 4. Fetch the updated case to return
        response = db.table("cases").select("*, actions(*)").eq("id", case_id).limit(1).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Case not found after update")
            
        updated_case = format_case(response.data[0])
        
        return {
            "message": f"Case successfully {decision}",
            "case": updated_case
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
