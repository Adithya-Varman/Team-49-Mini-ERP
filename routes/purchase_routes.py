from fastapi import APIRouter, Depends, HTTPException, Query
from models.purchase_order import PurchaseOrderCreate, PurchaseOrderReceive
from repositories import purchase_repository, product_repository, supplier_repository, audit_log_repository
from auth.dependencies import get_current_user
from services import purchase_service

router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"])


def _enrich_order(order):
    supplier = supplier_repository.find_by_id(order["supplier_id"])
    enriched = {**order, "supplier_name": supplier["name"] if supplier else "Unknown"}
    enriched_items = []
    for item in order["items"]:
        product = product_repository.find_by_id(item["product_id"])
        enriched_items.append({**item, "product_name": product["name"] if product else "Unknown", "product_sku": product["sku"] if product else ""})
    enriched["items"] = enriched_items
    return enriched


@router.get("")
def list_orders(status: str = Query(None), search: str = Query(None), user: dict = Depends(get_current_user)):
    filters = {}
    if status: filters["status"] = status
    if search: filters["search"] = search
    orders = purchase_repository.find_all(filters if filters else None)
    return [_enrich_order(o) for o in orders]


@router.get("/{order_id}")
def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = purchase_repository.find_by_id(order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    return _enrich_order(order)


@router.post("")
def create_order(data: PurchaseOrderCreate, user: dict = Depends(get_current_user)):
    supplier = supplier_repository.find_by_id(data.supplier_id)
    if not supplier: raise HTTPException(status_code=404, detail="Supplier not found")
    items = []
    for item in data.items:
        product = product_repository.find_by_id(item.product_id)
        if not product: raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        items.append({"product_id": item.product_id, "quantity": item.quantity, "received_qty": 0})
    order = purchase_repository.create({"supplier_id": data.supplier_id, "items": items, "created_by": user["sub"]})
    audit_log_repository.create({"user_id": user["sub"], "user_name": user["email"], "action": "Created Purchase Order", "entity_type": "PurchaseOrder", "reference_id": order["id"]})
    return _enrich_order(order)


@router.post("/{order_id}/confirm")
def confirm_order(order_id: str, user: dict = Depends(get_current_user)):
    success, message = purchase_service.confirm_order(order_id, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    order = purchase_repository.find_by_id(order_id)
    return {"message": message, "order": _enrich_order(order)}


@router.post("/{order_id}/receive")
def receive_order(order_id: str, data: PurchaseOrderReceive, user: dict = Depends(get_current_user)):
    success, message = purchase_service.receive_order(order_id, data.items, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    order = purchase_repository.find_by_id(order_id)
    return {"message": message, "order": _enrich_order(order)}


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    success, message = purchase_service.cancel_order(order_id, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    return {"message": message}
