from typing import Any
from bson import ObjectId
from datetime import datetime


def _serialize_value(v: Any) -> Any:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, dict):
        return {k: _serialize_value(val) for k, val in v.items()}
    if isinstance(v, list):
        return [_serialize_value(i) for i in v]
    return v


def serialize_doc(doc: dict) -> dict:
    if doc is None:
        return None
    return _serialize_value(doc)
