from database.mongo import connect, get_db, disconnect


def main():
    connect("mongodb://localhost:27017", db_name="erp")
    db = get_db()
    for name in [
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
    ]:
        print(f"{name}: {db[name].count_documents({})}")
    disconnect()


if __name__ == "__main__":
    main()
