from pydantic import BaseModel
from typing import List, Optional


class BomItem(BaseModel):
    component_id: str
    quantity: float


class BomCreate(BaseModel):
    product_id: str
    items: List[BomItem]


class BomUpdate(BaseModel):
    product_id: Optional[str] = None
    items: Optional[List[BomItem]] = None
