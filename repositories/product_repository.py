import uuid
import datetime
from database import products_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "search" in filters:
            q = filters["search"]
            query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"sku": {"$regex": q, "$options": "i"}},
            ]
        if "type" in filters:
            query["type"] = filters["type"]
    return _serialize_list(products_col.find(query))


def find_by_id(product_id):
    return _serialize(products_col.find_one({"id": product_id}))


def find_by_sku(sku):
    return _serialize(products_col.find_one({"sku": sku}))


def create(data):
    product = {
        "id": str(uuid.uuid4()),
        "sku": data.get("sku", ""),
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "type": data.get("type", "RAW"),
        "unit": data.get("unit", "pcs"),
        "sales_price": data.get("sales_price", 0.0),
        "cost_price": data.get("cost_price", 0.0),
        "min_stock": data.get("min_stock", 0.0),
        "on_hand_qty": data.get("on_hand_qty", 0.0),
        "reserved_qty": data.get("reserved_qty", 0.0),
        "procurement_strategy": data.get("procurement_strategy", "MTS"),
        "procure_on_demand": data.get("procure_on_demand", False),
        "procurement_type": data.get("procurement_type", "PURCHASE"),
        "default_supplier_id": data.get("default_supplier_id", None),
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    products_col.insert_one(product)
    return _serialize(product)


def update(product_id, data):
    product = find_by_id(product_id)
    if not product:
        return None
    updatable = [
        "sku", "name", "description", "type", "unit", "sales_price",
        "cost_price", "min_stock", "on_hand_qty", "reserved_qty",
        "procurement_strategy", "procure_on_demand", "procurement_type",
        "default_supplier_id"
    ]
    update_fields = {}
    for field in updatable:
        if field in data and data[field] is not None:
            update_fields[field] = data[field]
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    products_col.update_one({"id": product_id}, {"$set": update_fields})
    return find_by_id(product_id)


def delete(product_id):
    result = products_col.delete_one({"id": product_id})
    return result.deleted_count > 0
