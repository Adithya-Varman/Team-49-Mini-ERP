from pydantic import BaseModel
from typing import Optional


class ManufacturingOrderCreate(BaseModel):
    product_id: str
    quantity: float


class ManufacturingOrderComplete(BaseModel):
    completed_qty: float
