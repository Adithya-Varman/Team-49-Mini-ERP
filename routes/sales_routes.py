from fastapi import APIRouter, Depends, HTTPException, Query
from models.sales_order import SalesOrderCreate, SalesOrderDeliver
from repositories import sales_repository, product_repository, customer_repository, audit_log_repository
from auth.dependencies import require_sales
from services import sales_service

router = APIRouter(prefix="/api/sales-orders", tags=["Sales Orders"])


def _enrich_order(order):
    customer = customer_repository.find_by_id(order["customer_id"])
    enriched = {**order, "customer_name": customer["name"] if customer else "Unknown"}
    enriched_items = []
    for item in order["items"]:
        product = product_repository.find_by_id(item["product_id"])
        enriched_items.append({
            **item,
            "product_name": product["name"] if product else "Unknown",
            "product_sku": product["sku"] if product else "",
        })
    enriched["items"] = enriched_items
    return enriched


@router.get("")
def list_orders(status: str = Query(None), search: str = Query(None), user: dict = Depends(require_sales)):
    filters = {}
    if status: filters["status"] = status
    if search: filters["search"] = search
    orders = sales_repository.find_all(filters if filters else None)
    return [_enrich_order(o) for o in orders]


@router.get("/{order_id}")
def get_order(order_id: str, user: dict = Depends(require_sales)):
    order = sales_repository.find_by_id(order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    return _enrich_order(order)


@router.post("")
def create_order(data: SalesOrderCreate, user: dict = Depends(require_sales)):
    customer = customer_repository.find_by_id(data.customer_id)
    if not customer: raise HTTPException(status_code=404, detail="Customer not found")
    items = []
    for item in data.items:
        product = product_repository.find_by_id(item.product_id)
        if not product: raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        items.append({"product_id": item.product_id, "quantity": item.quantity, "price": item.price, "delivered_qty": 0})
    order = sales_repository.create({"customer_id": data.customer_id, "items": items, "created_by": user["sub"]})
    audit_log_repository.create({"user_id": user["sub"], "user_name": user["email"], "action": "Created Sales Order", "entity_type": "SalesOrder", "reference_id": order["id"]})
    return _enrich_order(order)


@router.post("/{order_id}/confirm")
def confirm_order(order_id: str, user: dict = Depends(require_sales)):
    success, message, data = sales_service.confirm_order(order_id, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail={"message": message, "data": data})
    order = sales_repository.find_by_id(order_id)
    result = {"message": message, "order": _enrich_order(order)}
    if data and "auto_procurements" in data: result["auto_procurements"] = data["auto_procurements"]
    return result


@router.post("/{order_id}/deliver")
def deliver_order(order_id: str, data: SalesOrderDeliver, user: dict = Depends(require_sales)):
    success, message = sales_service.deliver_order(order_id, data.items, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    order = sales_repository.find_by_id(order_id)
    return {"message": message, "order": _enrich_order(order)}


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str, user: dict = Depends(require_sales)):
    success, message = sales_service.cancel_order(order_id, user["sub"], user["email"])
    if not success: raise HTTPException(status_code=400, detail=message)
    return {"message": message}
