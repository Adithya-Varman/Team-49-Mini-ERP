import uuid
import datetime
from database import manufacturing_orders_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "status" in filters:
            query["status"] = filters["status"]
        if "product_id" in filters:
            query["product_id"] = filters["product_id"]
        if "search" in filters:
            query["id"] = {"$regex": filters["search"], "$options": "i"}
    return _serialize_list(manufacturing_orders_col.find(query))


def find_by_id(order_id):
    return _serialize(manufacturing_orders_col.find_one({"id": order_id}))


def create(data):
    order = {
        "id": "MO-" + str(uuid.uuid4())[:8].upper(),
        "product_id": data["product_id"],
        "quantity": data["quantity"],
        "completed_qty": 0,
        "status": "DRAFT",
        "auto_generated": data.get("auto_generated", False),
        "created_by": data.get("created_by", ""),
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    manufacturing_orders_col.insert_one(order)
    return _serialize(order)


def update(order_id, data):
    order = find_by_id(order_id)
    if not order:
        return None
    update_fields = {}
    for field in ["status", "quantity", "completed_qty"]:
        if field in data and data[field] is not None:
            update_fields[field] = data[field]
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    manufacturing_orders_col.update_one({"id": order_id}, {"$set": update_fields})
    return find_by_id(order_id)


def delete(order_id):
    result = manufacturing_orders_col.delete_one({"id": order_id})
    return result.deleted_count > 0
