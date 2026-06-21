from typing import Optional, List, Dict
from bson import ObjectId
from datetime import datetime


class PurchaseOrder:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        supplier_id: Optional[ObjectId] = None,
        items: Optional[List[Dict]] = None,
        total: float = 0.0,
        status: str = "",
        created_at: Optional[datetime] = None,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.supplier_id = (
            ObjectId(supplier_id) if supplier_id is not None and not isinstance(supplier_id, ObjectId) else supplier_id
        )
        self.items = items or []
        self.total = total
        self.status = status
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> dict:
        data = {
            "supplier_id": self.supplier_id,
            "items": self.items,
            "total": self.total,
            "status": self.status,
            "created_at": self.created_at,
        }
        if self.id:
            data["_id"] = self.id
        return data
