from repositories import product_repository, notification_repository, stock_ledger_repository


def get_free_qty(product):
    """Calculate free-to-use quantity."""
    return product["on_hand_qty"] - product["reserved_qty"]


def reserve_stock(product_id, qty, user_id="", user_name=""):
    """Reserve stock for a product."""
    product = product_repository.find_by_id(product_id)
    if not product:
        return False, "Product not found"
    free = get_free_qty(product)
    if free < qty:
        return False, f"Insufficient free stock. Available: {free}, Requested: {qty}"
    product_repository.update(product_id, {"reserved_qty": product["reserved_qty"] + qty})
    return True, "Stock reserved"


def release_stock(product_id, qty):
    """Release reserved stock."""
    product = product_repository.find_by_id(product_id)
    if not product:
        return False, "Product not found"
    product_repository.update(product_id, {"reserved_qty": max(0, product["reserved_qty"] - qty)})
    return True, "Stock released"


def consume_stock(product_id, qty, reason, reference, user_id="", user_name=""):
    """Consume stock (decrement on_hand and reserved)."""
    product = product_repository.find_by_id(product_id)
    if not product:
        return False, "Product not found"
    product_repository.update(product_id, {
        "on_hand_qty": product["on_hand_qty"] - qty,
        "reserved_qty": max(0, product["reserved_qty"] - qty),
    })
    # Create stock ledger entry
    stock_ledger_repository.create({
        "product_id": product_id,
        "change": -qty,
        "reason": reason,
        "reference": reference,
        "user_id": user_id,
        "user_name": user_name,
    })
    # Re-fetch after update for low stock check
    updated_product = product_repository.find_by_id(product_id)
    check_low_stock(updated_product)
    return True, "Stock consumed"


def add_stock(product_id, qty, reason, reference, user_id="", user_name=""):
    """Add stock (increment on_hand)."""
    product = product_repository.find_by_id(product_id)
    if not product:
        return False, "Product not found"
    product_repository.update(product_id, {"on_hand_qty": product["on_hand_qty"] + qty})
    # Create stock ledger entry
    stock_ledger_repository.create({
        "product_id": product_id,
        "change": qty,
        "reason": reason,
        "reference": reference,
        "user_id": user_id,
        "user_name": user_name,
    })
    # Re-fetch after update for low stock check
    updated_product = product_repository.find_by_id(product_id)
    check_low_stock(updated_product)
    return True, "Stock added"


def check_low_stock(product):
    """Check if product is below minimum stock and create notifications."""
    if product["on_hand_qty"] < product["min_stock"]:
        product_type = product["type"]
        product_name = product["name"]
        msg = f"Low stock alert: {product_name} (On hand: {product['on_hand_qty']}, Min: {product['min_stock']})"

        if product_type == "RAW":
            # Notify ADMIN and PURCHASE
            for role in ["ADMIN", "PURCHASE"]:
                notification_repository.create({
                    "title": "Low Stock Alert",
                    "message": msg,
                    "target_role": role,
                    "type": "LOW_STOCK",
                })
        elif product_type == "SEMI_FINISHED":
            # Notify ADMIN and MANUFACTURING
            for role in ["ADMIN", "MANUFACTURING"]:
                notification_repository.create({
                    "title": "Low Stock Alert",
                    "message": msg,
                    "target_role": role,
                    "type": "LOW_STOCK",
                })
        elif product_type == "FINISHED":
            if product["procurement_strategy"] == "MTS":
                # Notify ADMIN and MANUFACTURING
                for role in ["ADMIN", "MANUFACTURING"]:
                    notification_repository.create({
                        "title": "Low Stock Alert",
                        "message": msg,
                        "target_role": role,
                        "type": "LOW_STOCK",
                    })
            # MTO finished goods: ignore low stock notifications


def check_all_low_stock():
    """Check all products for low stock."""
    products = product_repository.find_all()
    alerts = []
    for p in products:
        if p["on_hand_qty"] < p["min_stock"]:
            alerts.append({
                "product_id": p["id"],
                "product_name": p["name"],
                "on_hand": p["on_hand_qty"],
                "min_stock": p["min_stock"],
                "type": p["type"],
            })
    return alerts
