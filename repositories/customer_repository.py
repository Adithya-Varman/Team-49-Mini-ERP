import uuid
import datetime
from database import customers_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "search" in filters:
            q = filters["search"]
            query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}},
            ]
    return _serialize_list(customers_col.find(query))


def find_by_id(customer_id):
    return _serialize(customers_col.find_one({"id": customer_id}))


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
    customers_col.insert_one(customer)
    return _serialize(customer)


def update(customer_id, data):
    customer = find_by_id(customer_id)
    if not customer:
        return None
    update_fields = {}
    for field in ["name", "phone", "email", "address"]:
        if field in data and data[field] is not None:
            update_fields[field] = data[field]
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    customers_col.update_one({"id": customer_id}, {"$set": update_fields})
    return find_by_id(customer_id)


def delete(customer_id):
    result = customers_col.delete_one({"id": customer_id})
    return result.deleted_count > 0
