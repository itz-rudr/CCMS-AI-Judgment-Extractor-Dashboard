from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from backend.db import get_supabase
from backend.services.formatter import format_case
from backend.repositories.cases import IN_MEMORY_CASES

dashboard_router = APIRouter()
analytics_router = APIRouter()

@dashboard_router.get("/", response_model=List[Dict[str, Any]])
async def get_approved_cases():
    """
    Retrieve only approved cases for the dashboard.
    """
    try:
        db = get_supabase()
        response = db.table("cases").select("*, actions(*)").execute()
        
        approved_cases = []
        for case in response.data:
            formatted = format_case(case)
            if formatted["reviewStatus"] == "Approved":
                approved_cases.append(formatted)
                
        return approved_cases
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@analytics_router.get("/", response_model=Dict[str, Any])
async def get_analytics():
    """
    Retrieve analytics and pipeline stats for the analytics page.
    """
    try:
        db = get_supabase()
        actions_res = db.table("actions").select("status, department").execute()
        db_actions = actions_res.data
        
        # Merge in-memory actions for real-time analytics
        mem_actions = []
        for c in IN_MEMORY_CASES:
            mem_actions.extend(c.get("actions", []))
            
        actions = db_actions + mem_actions
        
        pending_count = sum(1 for a in actions if a.get("status") == "pending")
        approved_count = sum(1 for a in actions if a.get("status") == "approved")
        rejected_count = sum(1 for a in actions if a.get("status") == "rejected")
        total_extracted = len(actions)
        
        # Dept summary
        dept_counts = {}
        for a in actions:
            dept = a.get("department") or "Unknown"
            if dept not in dept_counts:
                dept_counts[dept] = {"name": dept, "compliance": 0, "pending": 0, "overdue": 0}
            if a.get("status") == "approved":
                dept_counts[dept]["compliance"] += 1
            elif a.get("status") == "pending":
                dept_counts[dept]["pending"] += 1
                
        department_summary = list(dept_counts.values())

        return {
            "pipelineSteps": [
                {"title": "Pending Review", "count": pending_count, "detail": "Awaiting verification", "iconName": "Clock"},
                {"title": "Total Approved", "count": approved_count, "detail": "Successfully verified", "iconName": "CheckCircle2"},
                {"title": "Total Rejected", "count": rejected_count, "detail": "Needs AI tuning", "iconName": "AlertTriangle"},
                {"title": "Total Extracted", "count": total_extracted, "detail": "All time extractions", "iconName": "Activity"}
            ],
            "reviewerQueue": [
                {"label": "Nodal Officer queue", "value": pending_count, "detail": "High Priority", "iconName": "Users"}
            ],
            "departmentSummary": department_summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
