from sqlalchemy.orm import Session
from user_service.models.user_models import User
from user_service.schemas.user_schemas import UserCreate
from common.security.security import hash_password, verify_password, create_access_token

def create_user(db: Session, user: UserCreate):
    hashed_pw = hash_password(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def login_user(user: User):
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}