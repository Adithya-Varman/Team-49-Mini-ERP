from pydantic import BaseModel
from typing import Optional


class StockLedgerEntry(BaseModel):
    product_id: str
    change: float
    reason: str
    reference: str
