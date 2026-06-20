from fastapi import APIRouter, Depends, HTTPException, Query
from models.customer import CustomerCreate, CustomerUpdate
from repositories import customer_repository, audit_log_repository
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("")
def list_customers(search: str = Query(None), user: dict = Depends(get_current_user)):
    filters = {"search": search} if search else None
    return customer_repository.find_all(filters)


@router.get("/{customer_id}")
def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    customer = customer_repository.find_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("")
def create_customer(data: CustomerCreate, user: dict = Depends(get_current_user)):
    customer = customer_repository.create(data.model_dump())
    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Created Customer",
        "entity_type": "Customer",
        "reference_id": customer["id"],
    })
    return customer


@router.put("/{customer_id}")
def update_customer(customer_id: str, data: CustomerUpdate, user: dict = Depends(get_current_user)):
    updated = customer_repository.update(customer_id, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Customer not found")
    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Updated Customer",
        "entity_type": "Customer",
        "reference_id": customer_id,
    })
    return updated


@router.delete("/{customer_id}")
def delete_customer(customer_id: str, user: dict = Depends(get_current_user)):
    deleted = customer_repository.delete(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Deleted Customer",
        "entity_type": "Customer",
        "reference_id": customer_id,
    })
    return {"message": "Customer deleted"}
