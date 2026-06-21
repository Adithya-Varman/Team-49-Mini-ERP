from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
import os

_client: Optional[MongoClient] = None
_db_name = os.environ.get("ERP_DB_NAME", "erp")


def connect(uri: str = "mongodb://localhost:27017", db_name: Optional[str] = None) -> MongoClient:
    """Create a MongoClient and return it. Optionally set a database name for `get_db()`.

    Example: connect(uri, db_name='erp_test')
    """
    global _client, _db_name
    if db_name:
        _db_name = db_name
    if _client is None:
        _client = MongoClient(uri)
    return _client


def disconnect() -> None:
    """Close the MongoClient if it exists."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db() -> Database:
    """Return the configured Database instance (default name: 'erp')."""
    client = connect()
    return client[_db_name]
