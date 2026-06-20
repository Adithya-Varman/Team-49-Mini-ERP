import uuid
import datetime
from database import purchase_orders_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "status" in filters:
            query["status"] = filters["status"]
        if "supplier_id" in filters:
            query["supplier_id"] = filters["supplier_id"]
        if "search" in filters:
            query["id"] = {"$regex": filters["search"], "$options": "i"}
    return _serialize_list(purchase_orders_col.find(query))


def find_by_id(order_id):
    return _serialize(purchase_orders_col.find_one({"id": order_id}))


def create(data):
    order = {
        "id": "PO-" + str(uuid.uuid4())[:8].upper(),
        "supplier_id": data["supplier_id"],
        "items": data["items"],  # [{product_id, quantity, received_qty}]
        "status": "DRAFT",
        "auto_generated": data.get("auto_generated", False),
        "created_by": data.get("created_by", ""),
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    purchase_orders_col.insert_one(order)
    return _serialize(order)


def update(order_id, data):
    order = find_by_id(order_id)
    if not order:
        return None
    update_fields = {}
    for field in ["status", "items"]:
        if field in data and data[field] is not None:
            update_fields[field] = data[field]
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    purchase_orders_col.update_one({"id": order_id}, {"$set": update_fields})
    return find_by_id(order_id)


def delete(order_id):
    result = purchase_orders_col.delete_one({"id": order_id})
    return result.deleted_count > 0
