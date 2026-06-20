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


def find_by_id(customer_id):
    for c in _store:
        if c["id"] == customer_id:
            return c
    return None


def create(data):
    customer = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "address": data.get("address", ""),
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    _store.append(customer)
    return customer


def update(customer_id, data):
    customer = find_by_id(customer_id)
    if not customer:
        return None
    for field in ["name", "phone", "email", "address"]:
        if field in data and data[field] is not None:
            customer[field] = data[field]
    customer["updated_at"] = datetime.datetime.utcnow().isoformat()
    return customer


def delete(customer_id):
    global _store
    before = len(_store)
    _store = [c for c in _store if c["id"] != customer_id]
    return len(_store) < before
