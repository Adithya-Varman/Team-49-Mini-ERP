from fastapi import APIRouter, Depends
from repositories import (
    user_repository, product_repository, sales_repository,
    purchase_repository, manufacturing_repository,
    notification_repository, audit_log_repository
)
from auth.dependencies import get_current_user
from services.inventory_service import check_all_low_stock

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(user: dict = Depends(get_current_user)):
    role = user["role"]

    if role == "ADMIN":
        return {
            "total_users": len(user_repository.find_all()),
            "total_products": len(product_repository.find_all()),
            "sales_orders": len(sales_repository.find_all()),
            "purchase_orders": len(purchase_repository.find_all()),
            "manufacturing_orders": len(manufacturing_repository.find_all()),
            "low_stock_alerts": check_all_low_stock(),
            "notifications": notification_repository.find_all({"target_role": "ADMIN"})[:10],
            "recent_audit_logs": audit_log_repository.find_all()[:10],
        }
    elif role == "SALES":
        so = sales_repository.find_all()
        return {
            "confirmed_orders": len([o for o in so if o["status"] == "CONFIRMED"]),
            "partial_deliveries": len([o for o in so if o["status"] == "PARTIALLY_DELIVERED"]),
            "completed_deliveries": len([o for o in so if o["status"] == "FULLY_DELIVERED"]),
            "total_orders": len(so),
            "recent_orders": so[:10],
        }
    elif role == "PURCHASE":
        po = purchase_repository.find_all()
        return {
            "total_orders": len(po),
            "pending_receipts": len([o for o in po if o["status"] in ["CONFIRMED", "PARTIALLY_RECEIVED"]]),
            "completed_receipts": len([o for o in po if o["status"] == "FULLY_RECEIVED"]),
            "low_stock_alerts": check_all_low_stock(),
            "recent_orders": po[:10],
        }
    elif role == "MANUFACTURING":
        mo = manufacturing_repository.find_all()
        return {
            "total_orders": len(mo),
            "in_progress": len([o for o in mo if o["status"] == "IN_PROGRESS"]),
            "completed": len([o for o in mo if o["status"] == "COMPLETED"]),
            "production_alerts": notification_repository.find_all({"target_role": "MANUFACTURING"})[:5],
            "recent_orders": mo[:10],
        }
    return {}
