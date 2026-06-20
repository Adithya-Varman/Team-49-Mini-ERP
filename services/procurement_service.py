from repositories import product_repository, purchase_repository, manufacturing_repository, notification_repository


def trigger_auto_procurement(product, shortage_qty, user_id="", user_name=""):
    """
    Auto-create PO or MO based on product's procurement_type.
    Called when MTO + procure_on_demand = True and there's a shortage.
    """
    procurement_type = product["procurement_type"]
    product_name = product["name"]

    if procurement_type == "PURCHASE":
        # Create Purchase Order
        supplier_id = product.get("default_supplier_id", "")
        po = purchase_repository.create({
            "supplier_id": supplier_id or "",
            "items": [{"product_id": product["id"], "quantity": shortage_qty, "received_qty": 0}],
            "auto_generated": True,
            "created_by": user_id,
        })
        # Notify
        for role in ["ADMIN", "PURCHASE"]:
            notification_repository.create({
                "title": "Auto Procurement - Purchase Order Created",
                "message": f"PO {po['id']} auto-created for {shortage_qty} x {product_name}",
                "target_role": role,
                "type": "AUTO_PROCUREMENT",
            })
        return {"type": "PURCHASE_ORDER", "order": po}

    elif procurement_type == "MANUFACTURING":
        # Create Manufacturing Order
        mo = manufacturing_repository.create({
            "product_id": product["id"],
            "quantity": shortage_qty,
            "auto_generated": True,
            "created_by": user_id,
        })
        # Notify
        for role in ["ADMIN", "MANUFACTURING"]:
            notification_repository.create({
                "title": "Auto Procurement - Manufacturing Order Created",
                "message": f"MO {mo['id']} auto-created for {shortage_qty} x {product_name}",
                "target_role": role,
                "type": "PRODUCTION_REQUIRED",
            })
        return {"type": "MANUFACTURING_ORDER", "order": mo}

    return None
