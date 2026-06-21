from typing import Optional
from bson import ObjectId


class User:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        username: str = "",
        password_hash: str = "",
        role: str = "",
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.username = username
        self.password_hash = password_hash
        self.role = role

    def to_dict(self) -> dict:
        data = {"username": self.username, "password_hash": self.password_hash, "role": self.role}
        if self.id:
            data["_id"] = self.id
        return data
