from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from common.config.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
BCRYPT_MAX_BYTES = 72

def truncate_to_bcrypt_limit(password: str) -> str:
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES].decode("utf-8", errors="ignore")

def hash_password(password: str) -> str:
    return pwd_context.hash(truncate_to_bcrypt_limit(password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(truncate_to_bcrypt_limit(plain_password), hashed_password)

def create_access_token(data: dict, expires_delta: int = None):
    if expires_delta is None:
        expires_delta = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)