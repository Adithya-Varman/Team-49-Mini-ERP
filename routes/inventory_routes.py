from fastapi import APIRouter, Depends, Query
from repositories import product_repository, stock_ledger_repository
from auth.dependencies import get_current_active_user
from services.inventory_service import get_free_qty, check_all_low_stock

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("")
def list_inventory(
    type: str = Query(None),
    search: str = Query(None),
    user: dict = Depends(get_current_active_user)
):
    filters = {}
    if type:
        filters["type"] = type
    if search:
        filters["search"] = search
    products = product_repository.find_all(filters if filters else None)
    return [
        {
            "id": p["id"],
            "sku": p["sku"],
            "name": p["name"],
            "type": p["type"],
            "unit": p["unit"],
            "on_hand_qty": p["on_hand_qty"],
            "reserved_qty": p["reserved_qty"],
            "free_to_use_qty": get_free_qty(p),
            "min_stock": p["min_stock"],
            "procurement_strategy": p["procurement_strategy"],
        }
        for p in products
    ]


@router.get("/low-stock")
def get_low_stock_alerts(user: dict = Depends(get_current_active_user)):
    return check_all_low_stock()
