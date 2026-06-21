from repositories import (
    manufacturing_repository, product_repository, bom_repository,
    audit_log_repository, notification_repository
)
from services import inventory_service, procurement_service


def confirm_order(order_id, user_id="", user_name=""):
    """Confirm a manufacturing order - validates BoM exists."""
    order = manufacturing_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found", None
    if order["status"] not in ["DRAFT", "DELAYED"]:
        return False, "Order must be in DRAFT or DELAYED status", None

    was_delayed = order["status"] == "DELAYED"

    # Check BoM exists
    bom = bom_repository.find_by_product_id(order["product_id"])
    if not bom:
        return False, "No BoM found for this product", None

    qty = order["quantity"]
    shortages = []
    auto_procurements_triggered = False

    # Auto-procure components if there are shortages
    for bom_item in bom["items"]:
        component = product_repository.find_by_id(bom_item["component_id"])
        if component:
            needed = bom_item["quantity"] * qty
            free = inventory_service.get_free_qty(component)
            if free < needed:
                sub_shortage = needed - free
                shortages.append(component["name"])
                
                if not was_delayed:
                    result = procurement_service.trigger_auto_procurement(component, sub_shortage, user_id, user_name)
                    if result:
                        auto_procurements_triggered = True

    if shortages:
        if not was_delayed:
            manufacturing_repository.update(order_id, {"status": "DELAYED"})
            
            audit_log_repository.create({
                "user_id": user_id,
                "user_name": user_name,
                "action": "Delayed Manufacturing Order (Shortage)",
                "entity_type": "ManufacturingOrder",
                "reference_id": order_id,
            })
            
            return True, "Order delayed pending components", {"auto_procurements": auto_procurements_triggered}
        else:
            return False, "Still waiting for components (Auto-procured PO/MO already placed)", None

    manufacturing_repository.update(order_id, {"status": "CONFIRMED"})

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Confirmed Manufacturing Order",
        "entity_type": "ManufacturingOrder",
        "reference_id": order_id,
    })

    return True, "Manufacturing order confirmed", None


def start_production(order_id, user_id="", user_name=""):
    """
    Start production - check & reserve BoM components.
    """
    order = manufacturing_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found", None
    if order["status"] != "CONFIRMED":
        return False, "Order must be CONFIRMED to start", None

    product = product_repository.find_by_id(order["product_id"])
    bom = bom_repository.find_by_product_id(order["product_id"])
    if not bom:
        return False, "No BoM found", None

    qty = order["quantity"]
    shortages = []

    # Check all components have enough free stock
    for bom_item in bom["items"]:
        component = product_repository.find_by_id(bom_item["component_id"])
        if not component:
            return False, f"Component {bom_item['component_id']} not found", None

        needed = bom_item["quantity"] * qty
        free = inventory_service.get_free_qty(component)

        if free < needed:
            shortages.append({
                "component_name": component["name"],
                "needed": needed,
                "available": free,
                "shortage": needed - free,
            })

    if shortages:
        return False, "Insufficient component stock", {"shortages": shortages}

    # Reserve all components
    for bom_item in bom["items"]:
        needed = bom_item["quantity"] * qty
        inventory_service.reserve_stock(bom_item["component_id"], needed)

    manufacturing_repository.update(order_id, {"status": "IN_PROGRESS"})

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Started Manufacturing",
        "entity_type": "ManufacturingOrder",
        "reference_id": order_id,
    })

    return True, "Production started", None


def complete_production(order_id, completed_qty, user_id="", user_name=""):
    """
    Complete manufacturing - consume components, produce finished goods.
    """
    order = manufacturing_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found"
    if order["status"] != "IN_PROGRESS":
        return False, "Order must be IN_PROGRESS"
    if completed_qty > order["quantity"] - order["completed_qty"]:
        return False, "Completed qty exceeds remaining"

    product = product_repository.find_by_id(order["product_id"])
    bom = bom_repository.find_by_product_id(order["product_id"])
    if not bom:
        return False, "No BoM found"

    # Consume components
    for bom_item in bom["items"]:
        component_qty = bom_item["quantity"] * completed_qty
        component = product_repository.find_by_id(bom_item["component_id"])
        inventory_service.consume_stock(
            bom_item["component_id"], component_qty,
            "Manufacturing Consumption", order_id,
            user_id, user_name
        )

    # Produce finished goods
    inventory_service.add_stock(
        order["product_id"], completed_qty,
        "Manufacturing Production", order_id,
        user_id, user_name
    )

    # Update order
    new_completed = order["completed_qty"] + completed_qty
    update_data = {"completed_qty": new_completed}
    if new_completed >= order["quantity"]:
        update_data["status"] = "COMPLETED"
    manufacturing_repository.update(order_id, update_data)

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Completed Manufacturing",
        "entity_type": "ManufacturingOrder",
        "reference_id": order_id,
    })

    # Notify
    notification_repository.create({
        "title": "Manufacturing Completed",
        "message": f"Produced {completed_qty} x {product['name']}",
        "target_role": "ADMIN",
        "type": "INFO",
    })

    return True, "Production completed"


def cancel_order(order_id, user_id="", user_name=""):
    """Cancel a manufacturing order and release reserved components."""
    order = manufacturing_repository.find_by_id(order_id)
    if not order:
        return False, "Order not found"
    if order["status"] in ["COMPLETED", "CANCELLED"]:
        return False, "Cannot cancel this order"

    # Release reserved components if IN_PROGRESS
    if order["status"] == "IN_PROGRESS":
        bom = bom_repository.find_by_product_id(order["product_id"])
        if bom:
            remaining_qty = order["quantity"] - order["completed_qty"]
            for bom_item in bom["items"]:
                component_qty = bom_item["quantity"] * remaining_qty
                inventory_service.release_stock(bom_item["component_id"], component_qty)

    manufacturing_repository.update(order_id, {"status": "CANCELLED"})

    audit_log_repository.create({
        "user_id": user_id,
        "user_name": user_name,
        "action": "Cancelled Manufacturing Order",
        "entity_type": "ManufacturingOrder",
        "reference_id": order_id,
    })

    return True, "Manufacturing order cancelled"
