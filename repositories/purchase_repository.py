import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "status" in filters:
            results = [r for r in results if r["status"] == filters["status"]]
        if "supplier_id" in filters:
            results = [r for r in results if r["supplier_id"] == filters["supplier_id"]]
        if "search" in filters:
            q = filters["search"].lower()
            results = [r for r in results if q in r["id"].lower()]
    return results


def find_by_id(order_id):
    for o in _store:
        if o["id"] == order_id:
            return o
    return None


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
    _store.append(order)
    return order


def update(order_id, data):
    order = find_by_id(order_id)
    if not order:
        return None
    for field in ["status", "items"]:
        if field in data and data[field] is not None:
            order[field] = data[field]
    order["updated_at"] = datetime.datetime.utcnow().isoformat()
    return order


def delete(order_id):
    global _store
    before = len(_store)
    _store = [o for o in _store if o["id"] != order_id]
    return len(_store) < before
