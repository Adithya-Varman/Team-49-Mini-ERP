import uuid
import datetime
from database import suppliers_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "search" in filters:
            q = filters["search"]
            query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}},
            ]
    return _serialize_list(suppliers_col.find(query))


def find_by_id(supplier_id):
    return _serialize(suppliers_col.find_one({"id": supplier_id}))


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
    suppliers_col.insert_one(supplier)
    return _serialize(supplier)


def update(supplier_id, data):
    supplier = find_by_id(supplier_id)
    if not supplier:
        return None
    update_fields = {}
    for field in ["name", "phone", "email", "address"]:
        if field in data and data[field] is not None:
            update_fields[field] = data[field]
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    suppliers_col.update_one({"id": supplier_id}, {"$set": update_fields})
    return find_by_id(supplier_id)


def delete(supplier_id):
    result = suppliers_col.delete_one({"id": supplier_id})
    return result.deleted_count > 0
