from typing import Optional
from bson import ObjectId


class Product:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        name: str = "",
        sku: str = "",
        type: str = "",
        unit: str = "",
        stock: float = 0.0,
        price: float = 0.0,
        reorder_level: float = 0.0,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.name = name
        self.sku = sku
        self.type = type
        self.unit = unit
        self.stock = stock
        self.price = price
        self.reorder_level = reorder_level

    def to_dict(self) -> dict:
        data = {
            "name": self.name,
            "sku": self.sku,
            "type": self.type,
            "unit": self.unit,
            "stock": self.stock,
            "price": self.price,
            "reorder_level": self.reorder_level,
        }
        if self.id:
            data["_id"] = self.id
        return data
