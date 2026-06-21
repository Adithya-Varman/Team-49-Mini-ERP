from typing import Optional, Any
from bson import ObjectId
from datetime import datetime


class AuditLog:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        action: str = "",
        entity: str = "",
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        timestamp: Optional[datetime] = None,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.action = action
        self.entity = entity
        self.old_value = old_value
        self.new_value = new_value
        self.timestamp = timestamp or datetime.utcnow()

    def to_dict(self) -> dict:
        data = {
            "action": self.action,
            "entity": self.entity,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "timestamp": self.timestamp,
        }
        if self.id:
            data["_id"] = self.id
        return data
