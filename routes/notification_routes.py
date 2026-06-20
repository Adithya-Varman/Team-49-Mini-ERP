from fastapi import APIRouter, Depends, Query
from repositories import notification_repository
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(user: dict = Depends(get_current_user)):
    role = user["role"]
    notifications = notification_repository.find_all({"target_role": role})
    # Also include ADMIN notifications for admin
    if role == "ADMIN":
        notifications = notification_repository.find_all({"target_role": "ADMIN"})
    return notifications


@router.get("/unread-count")
def unread_count(user: dict = Depends(get_current_user)):
    return {"count": notification_repository.count_unread(user["role"])}


@router.post("/{notif_id}/read")
def mark_read(notif_id: str, user: dict = Depends(get_current_user)):
    notif = notification_repository.mark_read(notif_id)
    if not notif:
        return {"message": "Not found"}
    return notif


@router.post("/mark-all-read")
def mark_all_read(user: dict = Depends(get_current_user)):
    role = user["role"]
    notifications = notification_repository.find_all({"target_role": role})
    for n in notifications:
        notification_repository.mark_read(n["id"])
    return {"message": "All marked as read"}
