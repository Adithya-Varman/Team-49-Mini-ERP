from pydantic import BaseModel
from typing import Optional


class NotificationCreate(BaseModel):
    title: str
    message: str
    target_role: str
    type: str = "INFO"  # LOW_STOCK, AUTO_PROCUREMENT, PRODUCTION_REQUIRED, INFO
