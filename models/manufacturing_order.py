from typing import Optional
from bson import ObjectId


class ManufacturingOrder:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        product_id: Optional[ObjectId] = None,
        quantity: float = 0.0,
        status: str = "",
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.product_id = (
            ObjectId(product_id) if product_id is not None and not isinstance(product_id, ObjectId) else product_id
        )
        self.quantity = quantity
        self.status = status

    def to_dict(self) -> dict:
        data = {
            "product_id": self.product_id,
            "quantity": self.quantity,
            "status": self.status,
        }
        if self.id:
            data["_id"] = self.id
        return data
