import uuid
import datetime
from database import boms_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "product_id" in filters:
            query["product_id"] = filters["product_id"]
    return _serialize_list(boms_col.find(query))


def find_by_id(bom_id):
    return _serialize(boms_col.find_one({"id": bom_id}))


def find_by_product_id(product_id):
    return _serialize(boms_col.find_one({"product_id": product_id}))


def create(data):
    bom = {
        "id": str(uuid.uuid4()),
        "product_id": data["product_id"],
        "items": data["items"],  # [{component_id, quantity}]
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    boms_col.insert_one(bom)
    return _serialize(bom)


def update(bom_id, data):
    bom = find_by_id(bom_id)
    if not bom:
        return None
    update_fields = {}
    if "product_id" in data and data["product_id"] is not None:
        update_fields["product_id"] = data["product_id"]
    if "items" in data and data["items"] is not None:
        update_fields["items"] = data["items"]
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    boms_col.update_one({"id": bom_id}, {"$set": update_fields})
    return find_by_id(bom_id)


def delete(bom_id):
    result = boms_col.delete_one({"id": bom_id})
    return result.deleted_count > 0
