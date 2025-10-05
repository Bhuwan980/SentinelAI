# user_service/models/user_models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from common.db.db import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # User activity / verification fields
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    auth_provider = Column(String(50), default="local")  # local or google
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Optional profile fields
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    bio = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    notification_preferences = Column(String(1000), nullable=True)  # JSON string

    # Relationships to IP project models
    uploads = relationship("IpAssets", back_populates="user", cascade="all, delete-orphan")
    images = relationship("Images", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notifications", back_populates="user", cascade="all, delete-orphan")