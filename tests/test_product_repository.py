import os
from database.mongo import connect, disconnect
from repositories.product_repository import ProductRepository
from models.product import Product


TEST_DB = "erp_test"


def setup_module(module):
    # connect to test DB
    connect(db_name=TEST_DB)


def teardown_module(module):
    # clean up test collection and disconnect
    from database.mongo import get_db

    db = get_db()
    db.products.drop()
    disconnect()


def test_product_crud():
    repo = ProductRepository()

    # create
    p = Product(name="Tst", sku="TST-1", type="goods", unit="pcs", stock=1, price=1.0, reorder_level=0)
    pid = repo.create(p)
    assert pid is not None

    # read
    fetched = repo.get_by_id(pid)
    assert fetched is not None
    assert fetched["name"] == "Tst"

    # update
    updated = repo.update(pid, {"price": 2.5})
    assert updated in (0, 1)
    fetched2 = repo.get_by_id(pid)
    assert fetched2["price"] == 2.5

    # get_all
    all_items = repo.get_all()
    assert isinstance(all_items, list)

    # delete
    deleted = repo.delete(pid)
    assert deleted == 1
