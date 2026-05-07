from pydantic import BaseModel
from enum import Enum
from typing import Optional, Literal

UserRole = Literal["admin", "officer", "judge"]

class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Job(BaseModel):
    id: str
    status: JobStatus
    file_path: Optional[str] = None

class CaseStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    PENDING = "PENDING"

class Case(BaseModel):
    id: str
    case_number: str
    status: CaseStatus
    description: Optional[str] = None

class ActionType(str, Enum):
    EMAIL = "EMAIL"
    NOTIFICATION = "NOTIFICATION"
    TASK = "TASK"

class Action(BaseModel):
    id: str
    case_id: str
    action_type: ActionType
    description: str
    limitation_period: Optional[str] = None
