from typing import Optional, List, Dict
from bson import ObjectId
from datetime import datetime


class SalesOrder:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        customer_id: Optional[ObjectId] = None,
        items: Optional[List[Dict]] = None,
        total: float = 0.0,
        status: str = "",
        created_at: Optional[datetime] = None,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.customer_id = (
            ObjectId(customer_id) if customer_id is not None and not isinstance(customer_id, ObjectId) else customer_id
        )
        self.items = items or []
        self.total = total
        self.status = status
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> dict:
        data = {
            "customer_id": self.customer_id,
            "items": self.items,
            "total": self.total,
            "status": self.status,
            "created_at": self.created_at,
        }
        if self.id:
            data["_id"] = self.id
        return data
