from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "erp"

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]

# Collections
users_col = db["users"]
products_col = db["products"]
customers_col = db["customers"]
suppliers_col = db["suppliers"]
sales_orders_col = db["sales_orders"]
purchase_orders_col = db["purchase_orders"]
manufacturing_orders_col = db["manufacturing_orders"]
boms_col = db["boms"]
stock_ledger_col = db["stock_ledger"]
audit_logs_col = db["audit_logs"]
notifications_col = db["notifications"]


def _serialize(doc):
    """Remove MongoDB _id from document before returning to API."""
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


def _serialize_list(docs):
    """Serialize a list of MongoDB documents."""
    return [_serialize(doc) for doc in docs]


def init_collections():
    """Create all collections explicitly so they appear in Compass."""
    collection_names = [
        "users", "products", "customers", "suppliers",
        "sales_orders", "purchase_orders", "manufacturing_orders",
        "boms", "stock_ledger", "audit_logs", "notifications"
    ]
    existing = db.list_collection_names()
    for name in collection_names:
        if name not in existing:
            db.create_collection(name)
    print(f"MongoDB collections ready: {collection_names}")

