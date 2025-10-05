from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime


# ------------------ Base User ------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    language: Optional[str] = "en"
    timezone: Optional[str] = "UTC"
    notification_preferences: Optional[Dict] = None


# ------------------ Create & Auth ------------------
class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ------------------ Responses ------------------
class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    auth_provider: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ------------------ Forgot / Reset Password ------------------
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ------------------ Google Login ------------------
class GoogleLoginRequest(BaseModel):
    id_token: str   # Google’s ID token from frontend