from pydantic import BaseModel
from typing import Optional


class AuditLogCreate(BaseModel):
    action: str
    entity_type: str
    reference_id: str
