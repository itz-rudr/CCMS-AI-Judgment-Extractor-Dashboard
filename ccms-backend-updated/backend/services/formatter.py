def format_case(case_data: dict) -> dict:
    """
    Format a Supabase case record (with nested actions) into the JudgmentCase format expected by the frontend.
    """
    actions = case_data.get("actions", [])
    
    # Calculate review status
    statuses = [a.get("status", "pending") for a in actions]
    if not statuses or "pending" in statuses:
        review_status = "Needs Review"
    elif all(s == "approved" for s in statuses):
        review_status = "Approved"
    elif all(s == "rejected" for s in statuses):
        review_status = "Rejected"
    else:
        review_status = "Edited"
        
    # Calculate risk/priority
    priorities = [a.get("priority", "low") for a in actions]
    risk = "Medium"
    if "high" in priorities:
        risk = "Critical"
    elif "medium" in priorities:
        risk = "High"
        
    # Calculate avg confidence
    confidences = [a.get("confidence_score", 0) for a in actions]
    avg_confidence = int(sum(confidences) / len(confidences) * 100) if confidences else 0
    
    # Parties
    parties = case_data.get("parties_involved", "")
    petitioner, respondent = parties, ""
    if " vs " in parties.lower():
        parts = parties.lower().split(" vs ")
        petitioner, respondent = parts[0].title(), parts[1].title()
        
    # Action Plan
    action_plan = []
    for a in actions:
        action_plan.append({
            "title": a.get("action_required", ""),
            "owner": a.get("department", "Unknown"),
            "due": a.get("deadline") or "Not specified",
            "status": "Ready" if a.get("status") == "approved" else "In Progress"
        })
        
    # Dates
    deadlines = [a.get("deadline") for a in actions if a.get("deadline")]
    due_date = min(deadlines) if deadlines else "Not specified"
    
    return {
        "id": case_data.get("id"),
        "cisId": case_data.get("case_number", "Unknown"),
        "title": case_data.get("parties_involved", "Unknown"),
        "bench": case_data.get("judge_name", "Unknown Bench"),
        "department": actions[0].get("department", "Multiple") if len(actions) == 1 else "Multiple",
        "nodalOfficer": "Unassigned",
        "orderDate": str(case_data.get("created_at", ""))[:10],
        "ingestionTime": str(case_data.get("created_at", "")),
        "pages": 0,
        "sourceType": "Digital PDF",
        "petitioner": petitioner,
        "respondent": respondent,
        "reviewStatus": review_status,
        "risk": risk,
        "confidence": avg_confidence,
        "actionType": "Compliance",
        "actionSummary": case_data.get("summary", "No summary available"),
        "dueDate": due_date,
        "limitationDate": due_date,
        "timelineBasis": "Explicit in judgment",
        "responsibleOffice": actions[0].get("department", "Unknown") if len(actions) == 1 else "Multiple",
        "directions": case_data.get("legal_sections", []),
        "actionPlan": action_plan,
        "highlights": [
            {
                "id": a.get("id"),
                "label": "Extracted Action",
                "page": a.get("bbox_page") or 1,
                "confidence": int((a.get("confidence_score") or 0) * 100),
                "quote": a.get("action_required", ""),
                "field": "action",
                "box": {
                    "x": a.get("bbox_x0") or 0,
                    "y": a.get("bbox_y0") or 0,
                    "width": (a.get("bbox_x1") or 0) - (a.get("bbox_x0") or 0),
                    "height": (a.get("bbox_y1") or 0) - (a.get("bbox_y0") or 0)
                }
            } for a in actions
        ]
    }
