import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "user_id" in filters:
            results = [r for r in results if r["user_id"] == filters["user_id"]]
        if "entity_type" in filters:
            results = [r for r in results if r["entity_type"] == filters["entity_type"]]
        if "search" in filters:
            q = filters["search"].lower()
            results = [r for r in results if q in r["action"].lower() or q in r["entity_type"].lower()]
    return sorted(results, key=lambda x: x["timestamp"], reverse=True)


def create(data):
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": data.get("user_id", ""),
        "user_name": data.get("user_name", ""),
        "action": data["action"],
        "entity_type": data["entity_type"],
        "reference_id": data.get("reference_id", ""),
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
    _store.append(entry)
    return entry
