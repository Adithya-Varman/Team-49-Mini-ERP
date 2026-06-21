from typing import Optional
from bson import ObjectId


class Customer:
    def __init__(
        self,
        id: Optional[ObjectId] = None,
        name: str = "",
        email: str = "",
        phone: str = "",
        address: str = "",
        credit_limit: float = 0.0,
    ) -> None:
        self.id = ObjectId(id) if id is not None and not isinstance(id, ObjectId) else id
        self.name = name
        self.email = email
        self.phone = phone
        self.address = address
        self.credit_limit = credit_limit

    def to_dict(self) -> dict:
        data = {
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "credit_limit": self.credit_limit,
        }
        if self.id:
            data["_id"] = self.id
        return data
