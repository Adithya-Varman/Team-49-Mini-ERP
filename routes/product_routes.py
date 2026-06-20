from fastapi import APIRouter, Depends, HTTPException, Query
from models.product import ProductCreate, ProductUpdate
from repositories import product_repository, audit_log_repository
from auth.dependencies import get_current_user
from services.inventory_service import get_free_qty

router = APIRouter(prefix="/api/products", tags=["Products"])


def _product_response(p):
    return {
        **p,
        "free_to_use_qty": get_free_qty(p),
    }


@router.get("")
def list_products(
    search: str = Query(None),
    type: str = Query(None),
    user: dict = Depends(get_current_user)
):
    filters = {}
    if search:
        filters["search"] = search
    if type:
        filters["type"] = type
    products = product_repository.find_all(filters if filters else None)
    return [_product_response(p) for p in products]


@router.get("/{product_id}")
def get_product(product_id: str, user: dict = Depends(get_current_user)):
    product = product_repository.find_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_response(product)


@router.post("")
def create_product(data: ProductCreate, user: dict = Depends(get_current_user)):
    # Check duplicate SKU
    existing = product_repository.find_by_sku(data.sku)
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")

    product = product_repository.create(data.model_dump())

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Created Product",
        "entity_type": "Product",
        "reference_id": product["id"],
    })

    return _product_response(product)


@router.put("/{product_id}")
def update_product(product_id: str, data: ProductUpdate, user: dict = Depends(get_current_user)):
    updated = product_repository.update(product_id, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Updated Product",
        "entity_type": "Product",
        "reference_id": product_id,
    })

    return _product_response(updated)


@router.delete("/{product_id}")
def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    deleted = product_repository.delete(product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Deleted Product",
        "entity_type": "Product",
        "reference_id": product_id,
    })

    return {"message": "Product deleted"}
