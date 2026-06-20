from repositories import purchase_repository, product_repository, audit_log_repository
from services import inventory_service


def confirm_order(order_id, user_id="", user_name=""):
    """Confirm a purchase order."""
    order = purchase_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found"
    if order["status"] != "DRAFT":
        return False, "Order is not in DRAFT status"

    purchase_repository.update(order_id, {"status": "CONFIRMED"})

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Confirmed Purchase Order",
        "entity_type": "PurchaseOrder",
        "reference_id": order_id,
    })

    return True, "Purchase order confirmed"


def receive_order(order_id, receive_items, user_id="", user_name=""):
    """
    Receive items from a purchase order.
    receive_items: [{product_id, receive_qty}]
    """
    order = purchase_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found"
    if order["status"] not in ["CONFIRMED", "PARTIALLY_RECEIVED"]:
        return False, "Order must be CONFIRMED or PARTIALLY_RECEIVED"

    for receipt in receive_items:
        product_id = receipt["product_id"]
        receive_qty = receipt["receive_qty"]

        # Find matching order item
        order_item = None
        for item in order["items"]:
            if item["product_id"] == product_id:
                order_item = item
                break

        if not order_item:
            return False, f"Product {product_id} not in order"

        remaining = order_item["quantity"] - order_item["received_qty"]
        if receive_qty > remaining:
            return False, f"Cannot receive {receive_qty}. Remaining: {remaining}"

        # Add stock
        inventory_service.add_stock(
            product_id, receive_qty,
            "Purchase Receipt", order_id,
            user_id, user_name
        )

        # Update received qty
        order_item["received_qty"] += receive_qty

    # Save updated items back to MongoDB
    purchase_repository.update(order_id, {"items": order["items"]})

    # Check if fully received
    all_received = all(
        item["received_qty"] >= item["quantity"] for item in order["items"]
    )
    some_received = any(item["received_qty"] > 0 for item in order["items"])

    if all_received:
        purchase_repository.update(order_id, {"status": "FULLY_RECEIVED"})
    elif some_received:
        purchase_repository.update(order_id, {"status": "PARTIALLY_RECEIVED"})

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Received Purchase Order",
        "entity_type": "PurchaseOrder",
        "reference_id": order_id,
    })

    return True, "Receipt processed"


def cancel_order(order_id, user_id="", user_name=""):
    """Cancel a purchase order."""
    order = purchase_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found"
    if order["status"] in ["FULLY_RECEIVED", "CANCELLED"]:
        return False, "Cannot cancel this order"

    purchase_repository.update(order_id, {"status": "CANCELLED"})

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Cancelled Purchase Order",
        "entity_type": "PurchaseOrder",
        "reference_id": order_id,
    })

    return True, "Purchase order cancelled"
