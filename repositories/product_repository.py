import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "search" in filters:
            q = filters["search"].lower()
            results = [r for r in results if q in r["name"].lower() or q in r["sku"].lower()]
        if "type" in filters:
            results = [r for r in results if r["type"] == filters["type"]]
    return results


def find_by_id(product_id):
    for p in _store:
        if p["id"] == product_id:
            return p
    return None


def find_by_sku(sku):
    for p in _store:
        if p["sku"] == sku:
            return p
    return None


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
    _store.append(product)
    return product


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
    for field in updatable:
        if field in data and data[field] is not None:
            product[field] = data[field]
    product["updated_at"] = datetime.datetime.utcnow().isoformat()
    return product


def delete(product_id):
    global _store
    before = len(_store)
    _store = [p for p in _store if p["id"] != product_id]
    return len(_store) < before
