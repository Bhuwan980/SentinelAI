from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from common.db.db import get_db
from user_service.schemas.user_schemas import UserCreate, UserLogin, UserResponse
from user_service.services.user_services import create_user, authenticate_user, login_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = create_user(db, user)
    return db_user

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return login_user(db_user)

@router.post("/logout")
def logout():
    return {"message": "Logout successful"}