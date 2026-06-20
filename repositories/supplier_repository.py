import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "search" in filters:
            q = filters["search"].lower()
            results = [r for r in results if q in r["name"].lower() or q in r.get("email", "").lower()]
    return results


def find_by_id(supplier_id):
    for s in _store:
        if s["id"] == supplier_id:
            return s
    return None


def create(data):
    supplier = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "address": data.get("address", ""),
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    _store.append(supplier)
    return supplier


def update(supplier_id, data):
    supplier = find_by_id(supplier_id)
    if not supplier:
        return None
    for field in ["name", "phone", "email", "address"]:
        if field in data and data[field] is not None:
            supplier[field] = data[field]
    supplier["updated_at"] = datetime.datetime.utcnow().isoformat()
    return supplier


def delete(supplier_id):
    global _store
    before = len(_store)
    _store = [s for s in _store if s["id"] != supplier_id]
    return len(_store) < before
