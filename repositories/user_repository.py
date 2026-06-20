import uuid
import datetime
import bcrypt

_store = []


def _seed():
    """Seed default users on startup."""
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
    results = _store
    if filters:
        for key, val in filters.items():
            results = [r for r in results if r.get(key) == val]
    return results


def find_by_id(user_id):
    for u in _store:
        if u["id"] == user_id:
            return u
    return None


def find_by_email(email):
    for u in _store:
        if u["email"] == email:
            return u
    return None


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
    _store.append(user)
    return user


def update(user_id, data):
    user = find_by_id(user_id)
    if not user:
        return None
    if "name" in data and data["name"] is not None:
        user["name"] = data["name"]
    if "email" in data and data["email"] is not None:
        user["email"] = data["email"]
    if "password" in data and data["password"] is not None:
        user["password_hash"] = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    if "role" in data and data["role"] is not None:
        user["role"] = data["role"]
    user["updated_at"] = datetime.datetime.utcnow().isoformat()
    return user


def delete(user_id):
    global _store
    before = len(_store)
    _store = [u for u in _store if u["id"] != user_id]
    return len(_store) < before


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
