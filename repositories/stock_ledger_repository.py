import uuid
import datetime
from database import stock_ledger_col, _serialize, _serialize_list


def find_all(filters=None):
    query = {}
    if filters:
        if "product_id" in filters:
            query["product_id"] = filters["product_id"]
    return _serialize_list(stock_ledger_col.find(query).sort("date", -1))


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
    stock_ledger_col.insert_one(entry)
    return _serialize(entry)
