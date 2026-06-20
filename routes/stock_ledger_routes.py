from fastapi import APIRouter, Depends, Query
from repositories import stock_ledger_repository, product_repository
from auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/stock-ledger", tags=["Stock Ledger"])


@router.get("")
def list_entries(product_id: str = Query(None), user: dict = Depends(get_current_active_user)):
    filters = {}
    if product_id:
        filters["product_id"] = product_id
    entries = stock_ledger_repository.find_all(filters if filters else None)
    # Enrich with product name
    result = []
    for e in entries:
        product = product_repository.find_by_id(e["product_id"])
        result.append({
            **e,
            "product_name": product["name"] if product else "Unknown",
        })
    return result
