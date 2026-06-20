import uuid
import datetime
import bcrypt
from database import users_col, _serialize, _serialize_list


def _seed():
    """Seed default users on startup (only if no users exist)."""
    if users_col.count_documents({}) > 0:
        return
    defaults = [
        {"name": "Admin", "email": "admin@erp.com", "password": "password", "role": "ADMIN"},
        {"name": "Sales", "email": "sales@erp.com", "password": "password", "role": "SALES"},
        {"name": "Purchase", "email": "purchase@erp.com", "password": "password", "role": "PURCHASE"},
        {"name": "Manufacturing", "email": "manufacturing@erp.com", "password": "password", "role": "MANUFACTURING"},
    ]
    for u in defaults:
        create({
            "name": u["name"],
            "email": u["email"],
            "password": u["password"],
            "role": u["role"],
        })


def find_all(filters=None):
    query = {}
    if filters:
        for key, val in filters.items():
            query[key] = val
    return _serialize_list(users_col.find(query))


def find_by_id(user_id):
    return _serialize(users_col.find_one({"id": user_id}))


def find_by_email(email):
    return _serialize(users_col.find_one({"email": email}))


def create(data):
    user = {
        "id": str(uuid.uuid4()),
        "name": data["name"],
        "email": data["email"],
        "password_hash": bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "role": data["role"],
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    users_col.insert_one(user)
    return _serialize(user)


def update(user_id, data):
    user = find_by_id(user_id)
    if not user:
        return None
    update_fields = {}
    if "name" in data and data["name"] is not None:
        update_fields["name"] = data["name"]
    if "email" in data and data["email"] is not None:
        update_fields["email"] = data["email"]
    if "password" in data and data["password"] is not None:
        update_fields["password_hash"] = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    if "role" in data and data["role"] is not None:
        update_fields["role"] = data["role"]
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    users_col.update_one({"id": user_id}, {"$set": update_fields})
    return find_by_id(user_id)


def delete(user_id):
    result = users_col.delete_one({"id": user_id})
    return result.deleted_count > 0


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
