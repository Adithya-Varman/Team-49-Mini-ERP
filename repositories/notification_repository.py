import uuid
import datetime

_store = []


def find_all(filters=None):
    results = _store
    if filters:
        if "target_role" in filters:
            results = [r for r in results if r["target_role"] == filters["target_role"]]
        if "is_read" in filters:
            results = [r for r in results if r["is_read"] == filters["is_read"]]
        if "type" in filters:
            results = [r for r in results if r["type"] == filters["type"]]
    return sorted(results, key=lambda x: x["timestamp"], reverse=True)


def find_by_id(notif_id):
    for n in _store:
        if n["id"] == notif_id:
            return n
    return None


def create(data):
    notif = {
        "id": str(uuid.uuid4()),
        "title": data["title"],
        "message": data["message"],
        "target_role": data["target_role"],
        "type": data.get("type", "INFO"),
        "is_read": False,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
    _store.append(notif)
    return notif


def mark_read(notif_id):
    notif = find_by_id(notif_id)
    if notif:
        notif["is_read"] = True
        return notif
    return None


def count_unread(role):
    return len([n for n in _store if n["target_role"] == role and not n["is_read"]])
