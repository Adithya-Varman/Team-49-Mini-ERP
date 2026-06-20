from fastapi import APIRouter, Depends, HTTPException
from models.bom import BomCreate, BomUpdate
from repositories import bom_repository, product_repository, audit_log_repository
from auth.dependencies import require_manufacturing

router = APIRouter(prefix="/api/bom", tags=["BoM"])


def _enrich_bom(bom):
    """Add product and component names to BoM."""
    product = product_repository.find_by_id(bom["product_id"])
    enriched = {**bom, "product_name": product["name"] if product else "Unknown"}
    enriched_items = []
    for item in bom["items"]:
        component = product_repository.find_by_id(item["component_id"])
        enriched_items.append({
            **item,
            "component_name": component["name"] if component else "Unknown",
            "component_unit": component["unit"] if component else "",
        })
    enriched["items"] = enriched_items
    return enriched


@router.get("")
def list_boms(user: dict = Depends(require_manufacturing)):
    boms = bom_repository.find_all()
    return [_enrich_bom(b) for b in boms]


@router.get("/{bom_id}")
def get_bom(bom_id: str, user: dict = Depends(require_manufacturing)):
    bom = bom_repository.find_by_id(bom_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BoM not found")
    return _enrich_bom(bom)


@router.get("/product/{product_id}")
def get_bom_by_product(product_id: str, user: dict = Depends(require_manufacturing)):
    bom = bom_repository.find_by_product_id(product_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BoM not found for this product")
    return _enrich_bom(bom)


@router.post("")
def create_bom(data: BomCreate, user: dict = Depends(require_manufacturing)):
    # Check product exists
    product = product_repository.find_by_id(data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check no existing BoM
    existing = bom_repository.find_by_product_id(data.product_id)
    if existing:
        raise HTTPException(status_code=400, detail="BoM already exists for this product. Edit instead.")

    # Validate all components exist
    for item in data.items:
        comp = product_repository.find_by_id(item.component_id)
        if not comp:
            raise HTTPException(status_code=404, detail=f"Component {item.component_id} not found")

    bom_data = {
        "product_id": data.product_id,
        "items": [{"component_id": i.component_id, "quantity": i.quantity} for i in data.items],
    }
    bom = bom_repository.create(bom_data)

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Created BoM",
        "entity_type": "BoM",
        "reference_id": bom["id"],
    })

    return _enrich_bom(bom)


@router.put("/{bom_id}")
def update_bom(bom_id: str, data: BomUpdate, user: dict = Depends(require_manufacturing)):
    update_data = {}
    if data.product_id is not None:
        update_data["product_id"] = data.product_id
    if data.items is not None:
        update_data["items"] = [{"component_id": i.component_id, "quantity": i.quantity} for i in data.items]

    updated = bom_repository.update(bom_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="BoM not found")

    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Updated BoM",
        "entity_type": "BoM",
        "reference_id": bom_id,
    })

    return _enrich_bom(updated)


@router.delete("/{bom_id}")
def delete_bom(bom_id: str, user: dict = Depends(require_manufacturing)):
    deleted = bom_repository.delete(bom_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="BoM not found")
    audit_log_repository.create({
        "user_id": user["sub"],
        "user_name": user["email"],
        "action": "Deleted BoM",
        "entity_type": "BoM",
        "reference_id": bom_id,
    })
    return {"message": "BoM deleted"}
