from fastapi import APIRouter, Depends, HTTPException, Query
from models.supplier import SupplierCreate, SupplierUpdate
from repositories import supplier_repository, audit_log_repository
from auth.dependencies import require_purchase

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@router.get("")
def list_suppliers(search: str = Query(None), user: dict = Depends(require_purchase)):
    filters = {"search": search} if search else None
    return supplier_repository.find_all(filters)


@router.get("/{supplier_id}")
def get_supplier(supplier_id: str, user: dict = Depends(require_purchase)):
    supplier = supplier_repository.find_by_id(supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("")
def create_supplier(data: SupplierCreate, user: dict = Depends(require_purchase)):
    supplier = supplier_repository.create(data.model_dump())
    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Created Supplier",
        "entity_type": "Supplier",
        "reference_id": supplier["id"],
    })
    return supplier


@router.put("/{supplier_id}")
def update_supplier(supplier_id: str, data: SupplierUpdate, user: dict = Depends(require_purchase)):
    updated = supplier_repository.update(supplier_id, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Supplier not found")
    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Updated Supplier",
        "entity_type": "Supplier",
        "reference_id": supplier_id,
    })
    return updated


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str, user: dict = Depends(require_purchase)):
    deleted = supplier_repository.delete(supplier_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Supplier not found")
    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Deleted Supplier",
        "entity_type": "Supplier",
        "reference_id": supplier_id,
    })
    return {"message": "Supplier deleted"}
