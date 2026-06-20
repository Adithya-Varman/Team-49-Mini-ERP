from fastapi import APIRouter, Depends, HTTPException
from models.user import UserCreate, UserUpdate
from repositories import user_repository, audit_log_repository
from auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/users", tags=["Users"])

admin_only = RoleChecker(["ADMIN"])


@router.get("")
def list_users(user: dict = Depends(admin_only)):
    users = user_repository.find_all()
    return [
        {
            "id": u["id"],
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "created_at": u["created_at"],
        }
        for u in users
    ]


@router.post("")
def create_user(data: UserCreate, user: dict = Depends(admin_only)):
    # Check duplicate email
    existing = user_repository.find_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = user_repository.create(data.model_dump())

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Created User",
        "entity_type": "User",
        "reference_id": new_user["id"],
    })

    return {
        "id": new_user["id"],
        "name": new_user["name"],
        "email": new_user["email"],
        "role": new_user["role"],
        "created_at": new_user["created_at"],
    }


@router.put("/{user_id}")
def update_user(user_id: str, data: UserUpdate, user: dict = Depends(admin_only)):
    updated = user_repository.update(user_id, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Updated User",
        "entity_type": "User",
        "reference_id": user_id,
    })

    return {
        "id": updated["id"],
        "name": updated["name"],
        "email": updated["email"],
        "role": updated["role"],
        "created_at": updated["created_at"],
    }


@router.delete("/{user_id}")
def delete_user(user_id: str, user: dict = Depends(admin_only)):
    if user["sub"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    deleted = user_repository.delete(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Deleted User",
        "entity_type": "User",
        "reference_id": user_id,
    })

    return {"message": "User deleted"}
