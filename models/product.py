from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = ""
    type: str  # RAW, SEMI_FINISHED, FINISHED
    unit: str  # kg, pcs, L, m
    sales_price: float = 0.0
    cost_price: float = 0.0
    min_stock: float = 0.0
    on_hand_qty: float = 0.0
    reserved_qty: float = 0.0
    procurement_strategy: str = "MTS"  # MTS, MTO
    procure_on_demand: bool = False
    procurement_type: str = "PURCHASE"  # PURCHASE, MANUFACTURING
    default_supplier_id: Optional[str] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    unit: Optional[str] = None
    sales_price: Optional[float] = None
    cost_price: Optional[float] = None
    min_stock: Optional[float] = None
    on_hand_qty: Optional[float] = None
    reserved_qty: Optional[float] = None
    procurement_strategy: Optional[str] = None
    procure_on_demand: Optional[bool] = None
    procurement_type: Optional[str] = None
    default_supplier_id: Optional[str] = None
