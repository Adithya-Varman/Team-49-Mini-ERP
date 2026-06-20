import uuid
import datetime
from database import notifications_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "target_role" in filters:
            query["target_role"] = filters["target_role"]
        if "is_read" in filters:
            query["is_read"] = filters["is_read"]
        if "type" in filters:
            query["type"] = filters["type"]
    return _serialize_list(notifications_col.find(query).sort("timestamp", -1))


def find_by_id(notif_id):
    return _serialize(notifications_col.find_one({"id": notif_id}))


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
    notifications_col.insert_one(notif)
    return _serialize(notif)


def mark_read(notif_id):
    result = notifications_col.update_one({"id": notif_id}, {"$set": {"is_read": True}})
    if result.modified_count > 0:
        return find_by_id(notif_id)
    return None


def count_unread(role):
    return notifications_col.count_documents({"target_role": role, "is_read": False})
