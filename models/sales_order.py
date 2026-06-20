from pydantic import BaseModel
from typing import List, Optional


class SalesOrderItem(BaseModel):
    product_id: str
    quantity: float
    price: float
    delivered_qty: float = 0.0


class SalesOrderCreate(BaseModel):
    customer_id: str
    items: List[SalesOrderItem]


class SalesOrderDeliver(BaseModel):
    items: List[dict]  # [{product_id, deliver_qty}]
