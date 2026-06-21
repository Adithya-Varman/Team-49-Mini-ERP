from database.mongo import connect, disconnect
from models.product import Product
from repositories.product_repository import ProductRepository


def main():
    try:
        connect("mongodb://localhost:27017")
        repo = ProductRepository()

        # Create
        p = Product(name="TestRun", sku="TR-001", type="goods", unit="pcs", stock=5, price=1.23, reorder_level=2)
        pid = repo.create(p)
        print("inserted:", pid)

        # Read
        fetched = repo.get_by_id(pid)
        print("fetched:", fetched)

        # Update
        updated_count = repo.update(pid, {"price": 2.34})
        print("updated_count:", updated_count)
        fetched2 = repo.get_by_id(pid)
        print("fetched_after_update:", fetched2)

        # Delete
        deleted_count = repo.delete(pid)
        print("deleted_count:", deleted_count)

    except Exception as e:
        print("Error during test run:", type(e).__name__, e)
    finally:
        disconnect()


if __name__ == "__main__":
    main()
