import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "product_id" in filters:
            results = [r for r in results if r["product_id"] == filters["product_id"]]
    return sorted(results, key=lambda x: x["date"], reverse=True)


def create(data):
    entry = {
        "id": str(uuid.uuid4()),
        "date": datetime.datetime.utcnow().isoformat(),
        "product_id": data["product_id"],
        "change": data["change"],
        "reason": data["reason"],
        "reference": data.get("reference", ""),
        "user_id": data.get("user_id", ""),
        "user_name": data.get("user_name", ""),
    }
    _store.append(entry)
    return entry
