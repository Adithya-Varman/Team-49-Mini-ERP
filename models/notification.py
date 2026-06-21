from typing import Optional
from bson import ObjectId
from datetime import datetime


class Notification:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        user_id: Optional[ObjectId] = None,
        message: str = "",
        read: bool = False,
        timestamp: Optional[datetime] = None,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.user_id = (
            ObjectId(user_id) if user_id is not None and not isinstance(user_id, ObjectId) else user_id
        )
        self.message = message
        self.read = read
        self.timestamp = timestamp or datetime.utcnow()

    def to_dict(self) -> dict:
        data = {"user_id": self.user_id, "message": self.message, "read": self.read, "timestamp": self.timestamp}
        if self.id:
            data["_id"] = self.id
        return data
