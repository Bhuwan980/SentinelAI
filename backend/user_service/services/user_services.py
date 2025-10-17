from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from user_service.models.user_models import User
from user_service.schemas.user_schemas import UserCreate, UserResponse
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException
import json
from common.config.config import settings  

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Load secure values from .env via settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES or 30


# ---------------------- Create User ----------------------
def create_user(db: Session, user: UserCreate) -> UserResponse:
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone_number=user.phone_number,
        profile_image_url=user.profile_image_url,
        bio=user.bio,
        location=user.location,
        language=user.language,
        timezone=user.timezone,
        notification_preferences=json.dumps(user.notification_preferences or {}),
        is_active=True,
        is_verified=False,
        auth_provider="local",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    return UserResponse.from_orm(db_user)


# ---------------------- Authenticate ----------------------
def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password, user.hashed_password):
        return None
    return user


# ---------------------- Login ----------------------
def login_user(user: User) -> dict:
    """Generate JWT with email as subject"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,  # ✅ Email-based claim for get_current_user()
        "iat": datetime.utcnow(),
        "exp": expire
    }

    try:
        access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token generation failed: {str(e)}")


# ---------------------- Reset Password ----------------------
def generate_reset_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode = {"sub": user.email, "exp": expire}  # ✅ use email consistently
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def reset_password(db: Session, token: str, new_password: str) -> bool:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            return False
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return False
        user.hashed_password = pwd_context.hash(new_password)
        db.commit()
        db.refresh(user)
        return True
    except JWTError:
        return False


# ---------------------- Google Login ----------------------
def login_with_google(db: Session, google_email: str, username: str = None) -> dict:
    user = db.query(User).filter(User.email == google_email).first()
    if not user:
        try:
            user = User(
                username=username or google_email.split("@")[0],
                email=google_email,
                hashed_password="",
                full_name=None,
                phone_number=None,
                profile_image_url=None,
                bio=None,
                location=None,
                language="en",
                timezone="UTC",
                notification_preferences="{}",
                is_active=True,
                is_verified=True,
                auth_provider="google",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Username or email already exists")
    return login_user(user)