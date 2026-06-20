import uuid
import datetime
from database import audit_logs_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "user_id" in filters:
            query["user_id"] = filters["user_id"]
        if "entity_type" in filters:
            query["entity_type"] = filters["entity_type"]
        if "search" in filters:
            q = filters["search"]
            query["$or"] = [
                {"action": {"$regex": q, "$options": "i"}},
                {"entity_type": {"$regex": q, "$options": "i"}},
            ]
    return _serialize_list(audit_logs_col.find(query).sort("timestamp", -1))


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
    audit_logs_col.insert_one(entry)
    return _serialize(entry)
