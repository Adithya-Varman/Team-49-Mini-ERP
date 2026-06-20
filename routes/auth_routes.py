from fastapi import APIRouter, HTTPException
from models.user import UserLogin
from repositories import user_repository
from auth.jwt_handler import create_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login")
def login(data: UserLogin):
    user = user_repository.find_by_email(data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user_repository.verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], user["email"], user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"]
    }

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out"}


@router.get("/me")
def get_me():
    # This is handled by the frontend using stored JWT
    pass
