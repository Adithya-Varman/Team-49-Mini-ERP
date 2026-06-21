from typing import Optional, List, Dict
from bson import ObjectId


class BOM:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        product_id: Optional[ObjectId] = None,
        components: Optional[List[Dict]] = None,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.product_id = (
            ObjectId(product_id) if product_id is not None and not isinstance(product_id, ObjectId) else product_id
        )
        self.components = components or []

    def to_dict(self) -> dict:
        data = {"product_id": self.product_id, "components": self.components}
        if self.id:
            data["_id"] = self.id
        return data
