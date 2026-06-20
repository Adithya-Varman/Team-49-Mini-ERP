from repositories import sales_repository, product_repository, audit_log_repository
from services import inventory_service, procurement_service


def confirm_order(order_id, user_id="", user_name=""):
    """
    Confirm a sales order.
    Checks stock availability, handles MTS/MTO logic.
    """
    order = sales_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found", None
    if order["status"] != "DRAFT":
        return False, "Order is not in DRAFT status", None

    shortages = []
    auto_procurements = []

    for item in order["items"]:
        product = product_repository.find_by_id(item["product_id"])
        if not product:
            return False, f"Product {item['product_id']} not found", None

        free_qty = inventory_service.get_free_qty(product)
        needed = item["quantity"]

        if free_qty >= needed:
            # Enough stock - reserve it
            inventory_service.reserve_stock(item["product_id"], needed)
        else:
            # Shortage
            shortage = needed - free_qty
            strategy = product["procurement_strategy"]

            if strategy == "MTS":
                shortages.append({
                    "product_name": product["name"],
                    "needed": needed,
                    "available": free_qty,
                    "shortage": shortage,
                })
            elif strategy == "MTO":
                if product["procure_on_demand"]:
                    # Reserve whatever is available
                    if free_qty > 0:
                        inventory_service.reserve_stock(item["product_id"], free_qty)
                    # Trigger auto procurement for shortage
                    result = procurement_service.trigger_auto_procurement(
                        product, shortage, user_id, user_name
                    )
                    if result:
                        auto_procurements.append(result)
                else:
                    shortages.append({
                        "product_name": product["name"],
                        "needed": needed,
                        "available": free_qty,
                        "shortage": shortage,
                        "note": "MTO but auto-procure disabled",
                    })

    if shortages:
        return False, "Insufficient stock", {"shortages": shortages}

    # All good or auto-procurement triggered
    sales_repository.update(order_id, {"status": "CONFIRMED"})

    # Audit log
    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Confirmed Sales Order",
        "entity_type": "SalesOrder",
        "reference_id": order_id,
    })

    result_data = {"order": sales_repository.find_by_id(order_id)}
    if auto_procurements:
        result_data["auto_procurements"] = auto_procurements

    return True, "Order confirmed", result_data


def deliver_order(order_id, delivery_items, user_id="", user_name=""):
    """
    Deliver items from a confirmed sales order.
    delivery_items: [{product_id, deliver_qty}]
    """
    order = sales_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found"
    if order["status"] not in ["CONFIRMED", "PARTIALLY_DELIVERED"]:
        return False, "Order must be CONFIRMED or PARTIALLY_DELIVERED"

    for delivery in delivery_items:
        product_id = delivery["product_id"]
        deliver_qty = delivery["deliver_qty"]

        # Find matching order item
        order_item = None
        for item in order["items"]:
            if item["product_id"] == product_id:
                order_item = item
                break

        if not order_item:
            return False, f"Product {product_id} not in order"

        remaining = order_item["quantity"] - order_item["delivered_qty"]
        if deliver_qty > remaining:
            return False, f"Cannot deliver {deliver_qty}. Remaining: {remaining}"

        # Consume stock (on_hand and reserved both decrease)
        inventory_service.consume_stock(
            product_id, deliver_qty,
            "Sales Delivery", order_id,
            user_id, user_name
        )

        # Update delivered qty
        order_item["delivered_qty"] += deliver_qty

    # Check if fully delivered
    all_delivered = all(
        item["delivered_qty"] >= item["quantity"] for item in order["items"]
    )
    some_delivered = any(item["delivered_qty"] > 0 for item in order["items"])

    if all_delivered:
        sales_repository.update(order_id, {"status": "FULLY_DELIVERED"})
    elif some_delivered:
        sales_repository.update(order_id, {"status": "PARTIALLY_DELIVERED"})

    # Audit log
    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Delivered Sales Order",
        "entity_type": "SalesOrder",
        "reference_id": order_id,
    })

    return True, "Delivery processed"


def cancel_order(order_id, user_id="", user_name=""):
    """Cancel a sales order and release reserved stock."""
    order = sales_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found"
    if order["status"] in ["FULLY_DELIVERED", "CANCELLED"]:
        return False, "Cannot cancel this order"

    # Release reserved stock
    for item in order["items"]:
        remaining = item["quantity"] - item["delivered_qty"]
        if remaining > 0:
            inventory_service.release_stock(item["product_id"], remaining)

    sales_repository.update(order_id, {"status": "CANCELLED"})

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Cancelled Sales Order",
        "entity_type": "SalesOrder",
        "reference_id": order_id,
    })

    return True, "Order cancelled"
