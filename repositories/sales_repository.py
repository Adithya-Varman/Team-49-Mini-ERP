import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "status" in filters:
            results = [r for r in results if r["status"] == filters["status"]]
        if "customer_id" in filters:
            results = [r for r in results if r["customer_id"] == filters["customer_id"]]
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
        "id": "SO-" + str(uuid.uuid4())[:8].upper(),
        "customer_id": data["customer_id"],
        "items": data["items"],  # [{product_id, quantity, price, delivered_qty}]
        "status": "DRAFT",
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
