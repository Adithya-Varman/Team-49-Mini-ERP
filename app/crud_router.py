from fastapi import APIRouter, Body, HTTPException
from typing import Any, Dict
from starlette.status import HTTP_404_NOT_FOUND

from app.utils import serialize_doc


def create_crud_router(prefix: str, repo_cls) -> APIRouter:
    router = APIRouter(prefix=f"/{prefix}", tags=[prefix])
    repo = repo_cls()

    @router.post("/", summary=f"Create {prefix}")
    def create(item: Dict[str, Any] = Body(...)):
        inserted_id = repo.create(item)
        return {"id": str(inserted_id)}

    @router.get("/{item_id}", summary=f"Get {prefix} by id")
    def get_by_id(item_id: str):
        doc = repo.get_by_id(item_id)
        if not doc:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Not found")
        return serialize_doc(doc)

    @router.get("/", summary=f"List {prefix}")
    def list_all():
        docs = repo.get_all()
        return [serialize_doc(d) for d in docs]

    @router.put("/{item_id}", summary=f"Update {prefix} by id")
    def update(item_id: str, update_doc: Dict[str, Any] = Body(...)):
        modified = repo.update(item_id, update_doc)
        return {"modified_count": modified}

    @router.delete("/{item_id}", summary=f"Delete {prefix} by id")
    def delete(item_id: str):
        deleted = repo.delete(item_id)
        return {"deleted_count": deleted}

    return router
