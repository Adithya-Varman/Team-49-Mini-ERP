from pydantic import BaseModel
from typing import List, Optional


class PurchaseOrderItem(BaseModel):
    product_id: str
    quantity: float
    received_qty: float = 0.0


class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    items: List[PurchaseOrderItem]


class PurchaseOrderReceive(BaseModel):
    items: List[dict]  # [{product_id, receive_qty}]
