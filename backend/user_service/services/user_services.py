from sqlalchemy.orm import Session
from user_service.models.user_models import User
from user_service.schemas.user_schemas import UserCreate
from common.security.security import hash_password, verify_password, create_access_token
from datetime import datetime, timedelta
import jwt
from common.config.config import settings

# Utility to truncate passwords to bcrypt safe length (72 bytes)
BCRYPT_MAX_BYTES = 72

def truncate_password(password: str) -> str:
    encoded = password.encode("utf-8")[:BCRYPT_MAX_BYTES]  # max 72 bytes
    return encoded.decode("utf-8", errors="ignore")


# ---------------------- User CRUD & Auth ----------------------
def create_user(db: Session, user: UserCreate):
    """Create a new basic user with hashed password"""
    safe_password = truncate_password(user.password)
    hashed_pw = hash_password(safe_password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        is_active=True,
        is_verified=False,
        auth_provider="local",
        created_at=datetime.now(tz=None),
        updated_at=datetime.now(tz=None),
        last_login=None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user with email and password"""
    safe_password = truncate_password(password)
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(safe_password, user.hashed_password):
        return None
    return user


def login_user(user: User):
    """Generate JWT access token for authenticated user"""
    payload = {"sub": user.email, "iat": datetime.now(tz=None).timestamp()}
    token = create_access_token(payload)
    # update last login
    user.last_login = datetime.now(tz=None)
    return {"access_token": token, "token_type": "bearer"}


# ---------------------- Forgot / Reset Password ----------------------
def generate_reset_token(user: User, expires_minutes: int = 30):
    payload = {
        "sub": user.email,
        "exp": datetime.now(tz=None) + timedelta(minutes=expires_minutes)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token


def verify_reset_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def reset_password(db: Session, token: str, new_password: str):
    email = verify_reset_token(token)
    if not email:
        return False
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    safe_password = truncate_password(new_password)
    user.hashed_password = hash_password(safe_password)
    db.commit()
    return True


# ---------------------- Google OAuth Login ----------------------
def login_with_google(db: Session, google_email: str, username: str = None):
    """Login or create user with Google account"""
    user = db.query(User).filter(User.email == google_email).first()
    if not user:
        # create new user
        fake_password = jwt.encode({"sub": google_email}, settings.SECRET_KEY, algorithm="HS256")
        safe_password = truncate_password(fake_password)
        user = User(
            email=google_email,
            username=username or google_email.split("@")[0],
            hashed_password=hash_password(safe_password),
            is_active=True,
            is_verified=True,
            auth_provider="google",
            created_at=datetime.now(tz=None),
            updated_at=datetime.now(tz=None),
            last_login=datetime.now(tz=None)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.last_login = datetime.now(tz=None)
    return login_user(user)