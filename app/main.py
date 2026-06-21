from fastapi import FastAPI
from fastapi.responses import RedirectResponse
import uvicorn

from app.crud_router import create_crud_router

# Import repository classes
from repositories.product_repository import ProductRepository
from repositories.customer_repository import CustomerRepository
from repositories.supplier_repository import SupplierRepository
from repositories.sales_repository import SalesRepository
from repositories.purchase_repository import PurchaseRepository
from repositories.manufacturing_repository import ManufacturingRepository
from repositories.bom_repository import BOMRepository
from repositories.user_repository import UserRepository
from repositories.stock_repository import StockRepository
from repositories.audit_repository import AuditRepository
from repositories.notification_repository import NotificationRepository


app = FastAPI(title="ERP Data API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return RedirectResponse(url="/docs", status_code=307)


# Register crud routers
app.include_router(create_crud_router("products", ProductRepository))
app.include_router(create_crud_router("customers", CustomerRepository))
app.include_router(create_crud_router("suppliers", SupplierRepository))
app.include_router(create_crud_router("sales_orders", SalesRepository))
app.include_router(create_crud_router("purchase_orders", PurchaseRepository))
app.include_router(create_crud_router("manufacturing_orders", ManufacturingRepository))
app.include_router(create_crud_router("boms", BOMRepository))
app.include_router(create_crud_router("users", UserRepository))
app.include_router(create_crud_router("stock_ledger", StockRepository))
app.include_router(create_crud_router("audit_logs", AuditRepository))
app.include_router(create_crud_router("notifications", NotificationRepository))


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
