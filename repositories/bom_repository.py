import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "product_id" in filters:
            results = [r for r in results if r["product_id"] == filters["product_id"]]
    return results


def find_by_id(bom_id):
    for b in _store:
        if b["id"] == bom_id:
            return b
    return None


def find_by_product_id(product_id):
    for b in _store:
        if b["product_id"] == product_id:
            return b
    return None


def create(data):
    bom = {
        "id": str(uuid.uuid4()),
        "product_id": data["product_id"],
        "items": data["items"],  # [{component_id, quantity}]
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    _store.append(bom)
    return bom


def update(bom_id, data):
    bom = find_by_id(bom_id)
    if not bom:
        return None
    if "product_id" in data and data["product_id"] is not None:
        bom["product_id"] = data["product_id"]
    if "items" in data and data["items"] is not None:
        bom["items"] = data["items"]
    bom["updated_at"] = datetime.datetime.utcnow().isoformat()
    return bom


def delete(bom_id):
    global _store
    before = len(_store)
    _store = [b for b in _store if b["id"] != bom_id]
    return len(_store) < before
