from fastapi import APIRouter, Depends, HTTPException, Query
from models.manufacturing_order import ManufacturingOrderCreate, ManufacturingOrderComplete
from repositories import manufacturing_repository, product_repository, bom_repository, audit_log_repository
from auth.dependencies import get_current_user
from services import manufacturing_service

router = APIRouter(prefix="/api/manufacturing-orders", tags=["Manufacturing Orders"])


def _enrich_order(order):
    product = product_repository.find_by_id(order["product_id"])
    return {**order, "product_name": product["name"] if product else "Unknown", "product_sku": product["sku"] if product else ""}


@router.get("")
def list_orders(status: str = Query(None), search: str = Query(None), user: dict = Depends(get_current_user)):
    filters = {}
    if status: filters["status"] = status
    if search: filters["search"] = search
    orders = manufacturing_repository.find_all(filters if filters else None)
    return [_enrich_order(o) for o in orders]


@router.get("/{order_id}")
def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = manufacturing_repository.find_by_id(order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    return _enrich_order(order)


@router.post("")
def create_order(data: ManufacturingOrderCreate, user: dict = Depends(get_current_user)):
    product = product_repository.find_by_id(data.product_id)
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    bom = bom_repository.find_by_product_id(data.product_id)
    if not bom: raise HTTPException(status_code=400, detail="No BoM found for this product")
    order = manufacturing_repository.create({"product_id": data.product_id, "quantity": data.quantity, "created_by": user["sub"]})
    audit_log_repository.create({"user_id": user["sub"], "user_name": user["email"], "action": "Created Manufacturing Order", "entity_type": "ManufacturingOrder", "reference_id": order["id"]})
    return _enrich_order(order)


@router.post("/{order_id}/confirm")
def confirm_order(order_id: str, user: dict = Depends(get_current_user)):
    success, message, data = manufacturing_service.confirm_order(order_id, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    order = manufacturing_repository.find_by_id(order_id)
    return {"message": message, "order": _enrich_order(order)}


@router.post("/{order_id}/start")
def start_production(order_id: str, user: dict = Depends(get_current_user)):
    success, message, data = manufacturing_service.start_production(order_id, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail={"message": message, "data": data})
    order = manufacturing_repository.find_by_id(order_id)
    return {"message": message, "order": _enrich_order(order)}


@router.post("/{order_id}/complete")
def complete_production(order_id: str, data: ManufacturingOrderComplete, user: dict = Depends(get_current_user)):
    success, message = manufacturing_service.complete_production(order_id, data.completed_qty, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    order = manufacturing_repository.find_by_id(order_id)
    return {"message": message, "order": _enrich_order(order)}


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    success, message = manufacturing_service.cancel_order(order_id, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    return {"message": message}
