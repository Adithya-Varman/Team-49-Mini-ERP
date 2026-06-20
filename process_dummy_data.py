from repositories import sales_repository, purchase_repository, manufacturing_repository
from services import sales_service, purchase_service, manufacturing_service

def process_dummy_orders():
    # 1. Receive some Purchase Orders (to get raw materials into inventory)
    pos = purchase_repository.find_all({"status": "DRAFT"})[:5]
    for po in pos:
        # Confirm
        purchase_service.confirm_order(po["id"], "System", "Auto-Seed")
        # Receive all items
        receive_items = [{"product_id": item["product_id"], "receive_qty": item["quantity"]} for item in po["items"]]
        purchase_service.receive_order(po["id"], receive_items, "System", "Auto-Seed")

    # 2. Produce some Manufacturing Orders (uses raw materials, makes finished goods)
    mos = manufacturing_repository.find_all({"status": "DRAFT"})[:5]
    for mo in mos:
        # Confirm
        manufacturing_service.confirm_order(mo["id"], "System", "Auto-Seed")
        # Start
        started, _, _ = manufacturing_service.start_production(mo["id"], "System", "Auto-Seed")
        if started:
            # Complete all
            manufacturing_service.complete_production(mo["id"], mo["quantity"], "System", "Auto-Seed")

    # 3. Deliver some Sales Orders (sells finished goods)
    sos = sales_repository.find_all({"status": "DRAFT"})[:5]
    for so in sos:
        # Confirm
        confirmed, _, _ = sales_service.confirm_order(so["id"], "System", "Auto-Seed")
        if confirmed:
            # Deliver all items
            deliver_items = [{"product_id": item["product_id"], "deliver_qty": item["quantity"]} for item in so["items"]]
            sales_service.deliver_order(so["id"], deliver_items, "System", "Auto-Seed")

    print("Processed dummy orders: Stock Ledger and Audit Logs are now populated!")

if __name__ == "__main__":
    process_dummy_orders()
