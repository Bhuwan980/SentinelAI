from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict
from datetime import datetime

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

class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None  # Add this field

    class Config:
        orm_mode = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None  # Add this field
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    id_token: str