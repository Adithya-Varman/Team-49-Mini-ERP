import random
from repositories import (
    sales_repository, purchase_repository, manufacturing_repository,
    product_repository, customer_repository, supplier_repository
)

def seed_random_transactions():
    products = product_repository.find_all()
    customers = customer_repository.find_all()
    suppliers = supplier_repository.find_all()

    if not products or not customers or not suppliers:
        return

    # Filter products by type
    finished_goods = [p for p in products if p["type"] == "FINISHED"]
    raw_materials = [p for p in products if p["type"] == "RAW"]
    all_products = products

    # We need to make sure we don't pick empty lists
    if not finished_goods:
        finished_goods = products
    if not raw_materials:
        raw_materials = products

    # 1. Add ~20 Sales Orders
    for _ in range(20):
        cust = random.choice(customers)
        num_items = min(random.randint(1, 3), len(finished_goods))
        selected_prods = random.sample(finished_goods, num_items)
        items = []
        for prod in selected_prods:
            qty = random.randint(1, 10)
            items.append({
                "product_id": prod["id"],
                "quantity": qty,
                "price": prod["sales_price"] or random.randint(100, 1000),
                "delivered_qty": random.randint(0, qty)
            })
        status_choices = ["DRAFT", "CONFIRMED", "PARTIALLY_DELIVERED", "FULLY_DELIVERED"]
        sales_repository.create({
            "customer_id": cust["id"],
            "items": items,
            "created_by": "System Auto-Seed"
        })
        # Note: We aren't doing full status transitions to keep it simple, just creating them.
        
    # 2. Add ~15 Purchase Orders
    for _ in range(15):
        supp = random.choice(suppliers)
        num_items = min(random.randint(1, 4), len(raw_materials))
        selected_prods = random.sample(raw_materials, num_items)
        items = []
        for prod in selected_prods:
            qty = random.randint(50, 500)
            items.append({
                "product_id": prod["id"],
                "quantity": qty,
                "received_qty": random.randint(0, qty)
            })
        purchase_repository.create({
            "supplier_id": supp["id"],
            "items": items,
            "created_by": "System Auto-Seed"
        })

    # 3. Add ~15 Manufacturing Orders
    for _ in range(15):
        prod = random.choice(finished_goods)
        qty = random.randint(5, 50)
        manufacturing_repository.create({
            "product_id": prod["id"],
            "quantity": qty,
            "completed_qty": random.randint(0, qty),
            "created_by": "System Auto-Seed"
        })

    print("50 random transactions seeded successfully!")

if __name__ == "__main__":
    seed_random_transactions()
