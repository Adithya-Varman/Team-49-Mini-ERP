"""Seed realistic ERP sample data into MongoDB for Compass inspection.

Run this against the local MongoDB server, then open MongoDB Compass and
connect to mongodb://localhost:27017 to view the inserted data in the `erp`
database.
"""

from argparse import ArgumentParser
from datetime import datetime, timedelta
from bson import ObjectId

from database.mongo import connect, disconnect, get_db


COLLECTIONS = [
    "products",
    "customers",
    "suppliers",
    "sales_orders",
    "purchase_orders",
    "manufacturing_orders",
    "boms",
    "users",
    "stock_ledger",
    "audit_logs",
    "notifications",
]


def _money(value: float) -> float:
    return round(float(value), 2)


def seed(reset: bool = True) -> None:
    connect("mongodb://localhost:27017", db_name="erp")
    db = get_db()

    if reset:
        for name in COLLECTIONS:
            db[name].delete_many({})

    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)

    # Users
    admin_id = ObjectId()
    warehouse_id = ObjectId()
    sales_rep_id = ObjectId()

    users = [
        {
            "_id": admin_id,
            "username": "admin",
            "password_hash": "$2b$12$u1nqH2x3xk9g0vFQmF5YQeD8h5w4bQ0H8oJm6QfJq8yQ9QmT3cQ8G",
            "role": "admin",
        },
        {
            "_id": warehouse_id,
            "username": "warehouse1",
            "password_hash": "$2b$12$warehousehashplaceholder0000000000000000000000",
            "role": "warehouse",
        },
        {
            "_id": sales_rep_id,
            "username": "sales01",
            "password_hash": "$2b$12$saleshashplaceholder00000000000000000000000000",
            "role": "sales",
        },
    ]
    db.users.insert_many(users)

    # Customers
    customer_ids = [ObjectId(), ObjectId(), ObjectId()]
    customers = [
        {
            "_id": customer_ids[0],
            "name": "Acme Retail Ltd",
            "email": "procurement@acmeretail.com",
            "phone": "+1-212-555-0101",
            "address": "100 Market Street, New York, NY",
            "credit_limit": 50000,
        },
        {
            "_id": customer_ids[1],
            "name": "Northwind Office Supplies",
            "email": "orders@northwindoffice.com",
            "phone": "+1-312-555-0144",
            "address": "450 Lake Shore Dr, Chicago, IL",
            "credit_limit": 25000,
        },
        {
            "_id": customer_ids[2],
            "name": "Blue Ridge Electronics",
            "email": "purchasing@blueridgeelectronics.com",
            "phone": "+1-770-555-0188",
            "address": "77 Peachtree Ave, Atlanta, GA",
            "credit_limit": 75000,
        },
    ]
    db.customers.insert_many(customers)

    # Suppliers
    supplier_ids = [ObjectId(), ObjectId(), ObjectId()]
    suppliers = [
        {
            "_id": supplier_ids[0],
            "name": "Global Parts Co",
            "email": "orders@globalparts.com",
            "phone": "+1-312-555-0202",
            "address": "12 Industrial Park, Chicago, IL",
        },
        {
            "_id": supplier_ids[1],
            "name": "Precision Components Inc",
            "email": "sales@precisioncomponents.com",
            "phone": "+1-510-555-0310",
            "address": "88 Silicon Blvd, San Jose, CA",
        },
        {
            "_id": supplier_ids[2],
            "name": "Metro Logistics Supply",
            "email": "procurement@metrologistics.com",
            "phone": "+1-404-555-0440",
            "address": "600 Freight Way, Atlanta, GA",
        },
    ]
    db.suppliers.insert_many(suppliers)

    # Products
    product_ids = {
        "laptop": ObjectId(),
        "monitor": ObjectId(),
        "keyboard": ObjectId(),
        "ssd": ObjectId(),
        "ram": ObjectId(),
        "cpu": ObjectId(),
    }

    products = [
        {
            "_id": product_ids["laptop"],
            "name": "Business Laptop 14",
            "sku": "FG-LAP-014",
            "type": "finished_goods",
            "unit": "pcs",
            "stock": 18,
            "price": 1199.0,
            "reorder_level": 8,
        },
        {
            "_id": product_ids["monitor"],
            "name": "24-inch IPS Monitor",
            "sku": "FG-MON-024",
            "type": "finished_goods",
            "unit": "pcs",
            "stock": 34,
            "price": 219.5,
            "reorder_level": 12,
        },
        {
            "_id": product_ids["keyboard"],
            "name": "Wireless Keyboard",
            "sku": "ACC-KBD-001",
            "type": "accessory",
            "unit": "pcs",
            "stock": 95,
            "price": 49.99,
            "reorder_level": 30,
        },
        {
            "_id": product_ids["ssd"],
            "name": "512GB NVMe SSD",
            "sku": "COMP-SSD-512",
            "type": "component",
            "unit": "pcs",
            "stock": 140,
            "price": 68.0,
            "reorder_level": 40,
        },
        {
            "_id": product_ids["ram"],
            "name": "16GB DDR4 RAM",
            "sku": "COMP-RAM-16",
            "type": "component",
            "unit": "pcs",
            "stock": 180,
            "price": 45.0,
            "reorder_level": 50,
        },
        {
            "_id": product_ids["cpu"],
            "name": "Intel Core i5 Processor",
            "sku": "COMP-CPU-I5",
            "type": "component",
            "unit": "pcs",
            "stock": 60,
            "price": 175.0,
            "reorder_level": 20,
        },
    ]
    db.products.insert_many(products)

    # BOMs
    db.boms.insert_many(
        [
            {
                "_id": ObjectId(),
                "product_id": product_ids["laptop"],
                "components": [
                    {"product_id": product_ids["cpu"], "quantity": 1},
                    {"product_id": product_ids["ram"], "quantity": 2},
                    {"product_id": product_ids["ssd"], "quantity": 1},
                ],
            },
            {
                "_id": ObjectId(),
                "product_id": product_ids["monitor"],
                "components": [
                    {"product_id": product_ids["ssd"], "quantity": 0},
                ],
            },
        ]
    )

    # Sales orders
    sales_orders = [
        {
            "_id": ObjectId(),
            "customer_id": customer_ids[0],
            "items": [
                {"product_id": product_ids["laptop"], "quantity": 4, "price": 1199.0},
                {"product_id": product_ids["keyboard"], "quantity": 4, "price": 49.99},
            ],
            "total": _money(4 * 1199.0 + 4 * 49.99),
            "status": "confirmed",
            "created_at": yesterday,
        },
        {
            "_id": ObjectId(),
            "customer_id": customer_ids[1],
            "items": [
                {"product_id": product_ids["monitor"], "quantity": 10, "price": 219.5},
            ],
            "total": _money(10 * 219.5),
            "status": "packed",
            "created_at": now,
        },
        {
            "_id": ObjectId(),
            "customer_id": customer_ids[2],
            "items": [
                {"product_id": product_ids["keyboard"], "quantity": 20, "price": 49.99},
                {"product_id": product_ids["monitor"], "quantity": 8, "price": 219.5},
            ],
            "total": _money(20 * 49.99 + 8 * 219.5),
            "status": "shipped",
            "created_at": now,
        },
    ]
    db.sales_orders.insert_many(sales_orders)

    # Purchase orders
    purchase_orders = [
        {
            "_id": ObjectId(),
            "supplier_id": supplier_ids[0],
            "items": [
                {"product_id": product_ids["ssd"], "quantity": 100, "price": 68.0},
                {"product_id": product_ids["ram"], "quantity": 150, "price": 45.0},
            ],
            "total": _money(100 * 68.0 + 150 * 45.0),
            "status": "ordered",
            "created_at": yesterday,
        },
        {
            "_id": ObjectId(),
            "supplier_id": supplier_ids[1],
            "items": [
                {"product_id": product_ids["cpu"], "quantity": 40, "price": 175.0},
            ],
            "total": _money(40 * 175.0),
            "status": "received",
            "created_at": now,
        },
    ]
    db.purchase_orders.insert_many(purchase_orders)

    # Manufacturing orders
    db.manufacturing_orders.insert_many(
        [
            {
                "_id": ObjectId(),
                "product_id": product_ids["laptop"],
                "quantity": 12,
                "status": "planned",
            },
            {
                "_id": ObjectId(),
                "product_id": product_ids["monitor"],
                "quantity": 20,
                "status": "in_progress",
            },
        ]
    )

    # Stock ledger
    db.stock_ledger.insert_many(
        [
            {
                "_id": ObjectId(),
                "product_id": product_ids["laptop"],
                "type": "in",
                "quantity": 18,
                "reference_id": None,
                "date": yesterday,
            },
            {
                "_id": ObjectId(),
                "product_id": product_ids["monitor"],
                "type": "in",
                "quantity": 34,
                "reference_id": None,
                "date": yesterday,
            },
            {
                "_id": ObjectId(),
                "product_id": product_ids["keyboard"],
                "type": "out",
                "quantity": 4,
                "reference_id": None,
                "date": now,
            },
            {
                "_id": ObjectId(),
                "product_id": product_ids["ssd"],
                "type": "in",
                "quantity": 100,
                "reference_id": None,
                "date": now,
            },
        ]
    )

    # Audit logs
    db.audit_logs.insert_many(
        [
            {
                "_id": ObjectId(),
                "action": "seed_data",
                "entity": "users",
                "old_value": None,
                "new_value": {"count": len(users)},
                "timestamp": now,
            },
            {
                "_id": ObjectId(),
                "action": "seed_data",
                "entity": "products",
                "old_value": None,
                "new_value": {"count": len(products)},
                "timestamp": now,
            },
            {
                "_id": ObjectId(),
                "action": "seed_data",
                "entity": "sales_orders",
                "old_value": None,
                "new_value": {"count": len(sales_orders)},
                "timestamp": now,
            },
        ]
    )

    # Notifications
    db.notifications.insert_many(
        [
            {
                "_id": ObjectId(),
                "user_id": sales_rep_id,
                "message": "Sales order SO-1003 has been shipped.",
                "read": False,
                "timestamp": now,
            },
            {
                "_id": ObjectId(),
                "user_id": warehouse_id,
                "message": "Purchase order PO-2001 has been received and posted to stock.",
                "read": False,
                "timestamp": now,
            },
            {
                "_id": ObjectId(),
                "user_id": admin_id,
                "message": "Monthly sales report is ready for review.",
                "read": True,
                "timestamp": now,
            },
        ]
    )

    disconnect()


if __name__ == "__main__":
    parser = ArgumentParser(description="Seed realistic dummy ERP data into MongoDB")
    parser.add_argument("--keep-existing", action="store_true", help="Do not clear existing sample data before seeding")
    args = parser.parse_args()
    seed(reset=not args.keep_existing)
