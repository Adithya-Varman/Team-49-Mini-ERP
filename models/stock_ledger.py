from typing import Optional
from bson import ObjectId
from datetime import datetime


class StockLedger:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        product_id: Optional[ObjectId] = None,
        type: str = "",
        quantity: float = 0.0,
        reference_id: Optional[ObjectId] = None,
        date: Optional[datetime] = None,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.product_id = (
            ObjectId(product_id) if product_id is not None and not isinstance(product_id, ObjectId) else product_id
        )
        self.type = type
        self.quantity = quantity
        self.reference_id = (
            ObjectId(reference_id) if reference_id is not None and not isinstance(reference_id, ObjectId) else reference_id
        )
        self.date = date

    def to_dict(self) -> dict:
        data = {
            "product_id": self.product_id,
            "type": self.type,
            "quantity": self.quantity,
            "reference_id": self.reference_id,
            "date": self.date,
        }
        if self.id:
            data["_id"] = self.id
        return data
