from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes import (
    auth_routes, user_routes, product_routes, customer_routes,
    supplier_routes, bom_routes, sales_routes, purchase_routes,
    manufacturing_routes, inventory_routes, stock_ledger_routes,
    audit_log_routes, notification_routes, dashboard_routes
)
from repositories import (
    user_repository, product_repository, customer_repository,
    supplier_repository, bom_repository, sales_repository,
    purchase_repository, manufacturing_repository
)


@asynccontextmanager
async def lifespan(app):
    seed_data()
    yield


app = FastAPI(title="Mini ERP", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(product_routes.router)
app.include_router(customer_routes.router)
app.include_router(supplier_routes.router)
app.include_router(bom_routes.router)
app.include_router(sales_routes.router)
app.include_router(purchase_routes.router)
app.include_router(manufacturing_routes.router)
app.include_router(inventory_routes.router)
app.include_router(stock_ledger_routes.router)
app.include_router(audit_log_routes.router)
app.include_router(notification_routes.router)
app.include_router(dashboard_routes.router)


def seed_data():
    """Seed initial data for testing. Only seeds if database is empty."""
    from database import products_col, init_collections

    # Ensure all collections exist in MongoDB
    init_collections()

    # Guard: skip seeding if data already exists in MongoDB
    if products_col.count_documents({}) > 0:
        print("Database already has data — skipping seed.")
        return

    # Seed users
    user_repository._seed()

    # Seed suppliers
    s1 = supplier_repository.create({"name": "Wood Supplier Co", "phone": "111-1111", "email": "wood@supplier.com", "address": "123 Forest Rd"})
    s2 = supplier_repository.create({"name": "Metal Parts Inc", "phone": "222-2222", "email": "metal@supplier.com", "address": "456 Steel Ave"})
    s3 = supplier_repository.create({"name": "Hardware Store", "phone": "333-3333", "email": "hw@supplier.com", "address": "789 Bolt St"})

    # Seed customers
    c1 = customer_repository.create({"name": "Home Furnish Ltd", "phone": "444-4444", "email": "contact@homefurnish.com", "address": "10 Home Lane"})
    c2 = customer_repository.create({"name": "Office Depot", "phone": "555-5555", "email": "orders@officedepot.com", "address": "20 Office Blvd"})

    # Seed products
    p_wood = product_repository.create({
        "sku": "RAW-001", "name": "Wood Plank", "description": "Premium oak wood plank",
        "type": "RAW", "unit": "pcs", "sales_price": 0, "cost_price": 50,
        "min_stock": 20, "on_hand_qty": 100, "reserved_qty": 0,
        "procurement_strategy": "MTS", "procure_on_demand": False,
        "procurement_type": "PURCHASE", "default_supplier_id": s1["id"],
    })
    p_screws = product_repository.create({
        "sku": "RAW-002", "name": "Screws (Box of 100)", "description": "Steel wood screws",
        "type": "RAW", "unit": "pcs", "sales_price": 0, "cost_price": 10,
        "min_stock": 50, "on_hand_qty": 500, "reserved_qty": 0,
        "procurement_strategy": "MTS", "procure_on_demand": False,
        "procurement_type": "PURCHASE", "default_supplier_id": s3["id"],
    })
    p_legs = product_repository.create({
        "sku": "SEMI-001", "name": "Table Leg", "description": "Turned wooden table leg",
        "type": "SEMI_FINISHED", "unit": "pcs", "sales_price": 0, "cost_price": 25,
        "min_stock": 10, "on_hand_qty": 50, "reserved_qty": 0,
        "procurement_strategy": "MTS", "procure_on_demand": False,
        "procurement_type": "MANUFACTURING", "default_supplier_id": None,
    })
    p_top = product_repository.create({
        "sku": "SEMI-002", "name": "Table Top", "description": "Flat wooden table top",
        "type": "SEMI_FINISHED", "unit": "pcs", "sales_price": 0, "cost_price": 80,
        "min_stock": 5, "on_hand_qty": 20, "reserved_qty": 0,
        "procurement_strategy": "MTS", "procure_on_demand": False,
        "procurement_type": "MANUFACTURING", "default_supplier_id": None,
    })
    p_table = product_repository.create({
        "sku": "FIN-001", "name": "Dining Table", "description": "4-seater oak dining table",
        "type": "FINISHED", "unit": "pcs", "sales_price": 500, "cost_price": 250,
        "min_stock": 5, "on_hand_qty": 10, "reserved_qty": 0,
        "procurement_strategy": "MTS", "procure_on_demand": True,
        "procurement_type": "MANUFACTURING", "default_supplier_id": None,
    })
    p_chair = product_repository.create({
        "sku": "FIN-002", "name": "Office Chair", "description": "Ergonomic office chair",
        "type": "FINISHED", "unit": "pcs", "sales_price": 300, "cost_price": 150,
        "min_stock": 3, "on_hand_qty": 8, "reserved_qty": 0,
        "procurement_strategy": "MTO", "procure_on_demand": True,
        "procurement_type": "PURCHASE", "default_supplier_id": s2["id"],
    })

    # Seed BoM: Dining Table
    bom_repository.create({
        "product_id": p_table["id"],
        "items": [
            {"component_id": p_legs["id"], "quantity": 4},
            {"component_id": p_top["id"], "quantity": 1},
            {"component_id": p_screws["id"], "quantity": 12},
        ]
    })

    # Seed 50 furniture-context products (raw materials, sub-assemblies, finished furniture)
    from seed_products import get_extra_products
    for p_data in get_extra_products(s1["id"], s2["id"], s3["id"]):
        product_repository.create(p_data)

    print("Seed data loaded successfully!")

    # Seed some dummy transactions so the UI isn't empty
    sales_repository.create({
        "customer_id": c1["id"],
        "items": [
            {"product_id": p_table["id"], "quantity": 2, "price": 500, "delivered_qty": 0},
            {"product_id": p_chair["id"], "quantity": 4, "price": 300, "delivered_qty": 0}
        ],
        "created_by": "System"
    })

    purchase_repository.create({
        "supplier_id": s1["id"],
        "items": [
            {"product_id": p_wood["id"], "quantity": 100, "received_qty": 0}
        ],
        "created_by": "System"
    })

    manufacturing_repository.create({
        "product_id": p_table["id"],
        "quantity": 5,
        "created_by": "System"
    })



# Serve static files (frontend) - must be last
app.mount("/", StaticFiles(directory="static", html=True), name="static")
