from fastapi import APIRouter, Depends, Query
from repositories import audit_log_repository
from auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("")
def list_logs(
    entity_type: str = Query(None),
    search: str = Query(None),
    user: dict = Depends(get_current_active_user)
):
    filters = {}
    # Non-admins can only see their own logs
    if user["role"] != "ADMIN":
        filters["user_id"] = user["sub"]
    if entity_type:
        filters["entity_type"] = entity_type
    if search:
        filters["search"] = search
    return audit_log_repository.find_all(filters if filters else None)
