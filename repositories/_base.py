from typing import Any, Dict, Iterable, List, Optional
from bson import ObjectId
from database.mongo import get_db


class BaseRepository:
    COLLECTION: str

    def __init__(self) -> None:
        self._coll = get_db()[self.COLLECTION]

    def create(self, obj: Any) -> ObjectId:
        data = obj.to_dict() if hasattr(obj, "to_dict") else dict(obj)
        res = self._coll.insert_one(data)
        return res.inserted_id

    def get_by_id(self, id: Any) -> Optional[Dict]:
        oid = ObjectId(id) if not isinstance(id, ObjectId) else id
        return self._coll.find_one({"_id": oid})

    def get_all(self, filter: Dict = None) -> List[Dict]:
        cursor = self._coll.find(filter or {})
        return list(cursor)

    def update(self, id: Any, update_dict: Dict) -> int:
        oid = ObjectId(id) if not isinstance(id, ObjectId) else id
        res = self._coll.update_one({"_id": oid}, {"$set": update_dict})
        return res.modified_count

    def delete(self, id: Any) -> int:
        oid = ObjectId(id) if not isinstance(id, ObjectId) else id
        res = self._coll.delete_one({"_id": oid})
        return res.deleted_count
