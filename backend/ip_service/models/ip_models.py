# ip_service/models/ip_models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    ForeignKey,
    Text,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from common.db.db import Base
from datetime import datetime

# Import User for relationships
from user_service.models.user_models import User


class Images(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    source_page_url = Column(String(1000))
    domain = Column(String(255))
    status_code = Column(Integer)
    content_type = Column(String(50))
    file_size_bytes = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    page_title = Column(String(255))
    img_alt = Column(String(255))
    sha256 = Column(String(64))
    phash = Column(String(64))
    s3_path = Column(String(500))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_seen = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="images")
    embeddings = relationship("ImageEmbeddings", back_populates="image", cascade="all, delete-orphan")
    matches = relationship("IpMatches", back_populates="source_image", cascade="all, delete-orphan")


class ImageEmbeddings(Base):
    __tablename__ = "image_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    vector = Column(JSON, nullable=False)
    model = Column(String(50), default="clip-vit")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    image = relationship("Images", back_populates="embeddings")


class IpAssets(Base):
    __tablename__ = "ip_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    asset_type = Column(String(50))
    file_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="uploads")
    embeddings = relationship("IpEmbeddings", back_populates="asset", cascade="all, delete-orphan")
    matches = relationship("IpMatches", back_populates="matched_asset", cascade="all, delete-orphan")
    notifications = relationship("Notifications", back_populates="asset", cascade="all, delete-orphan")


class IpEmbeddings(Base):
    __tablename__ = "ip_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=False)
    vector = Column(JSON, nullable=False)
    model = Column(String(50), default="clip-vit")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    asset = relationship("IpAssets", back_populates="embeddings")


class IpMatches(Base):
    __tablename__ = "ip_matches"

    id = Column(Integer, primary_key=True, index=True)
    source_image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    matched_asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    user_confirmed = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    source_image = relationship("Images", back_populates="matches")
    matched_asset = relationship("IpAssets", back_populates="matches")
    notification = relationship("Notifications", back_populates="match", uselist=False)


class Notifications(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("ip_matches.id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=True)
    message = Column(String(1000), nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    match = relationship("IpMatches", back_populates="notification")
    asset = relationship("IpAssets", back_populates="notifications")


class DmcaReports(Base):
    __tablename__ = "dmca_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("ip_matches.id"), nullable=False)
    
    # URLs
    infringing_url = Column(String(1000), nullable=False)
    screenshot_url = Column(String(1000), nullable=True)
    original_image_url = Column(String(1000), nullable=True)
    
    # Additional context
    image_caption = Column(Text, nullable=True)
    similarity_score = Column(Float, nullable=True)
    
    # Detailed metadata from suspected page
    page_metadata = Column(JSON, nullable=True)  # Stores all scraped metadata
    page_title = Column(String(500), nullable=True)
    page_author = Column(String(255), nullable=True)
    page_description = Column(Text, nullable=True)
    page_tags = Column(JSON, nullable=True)  # Array of tags
    page_copyright = Column(Text, nullable=True)
    suspected_image_alt = Column(String(500), nullable=True)
    suspected_image_title = Column(String(500), nullable=True)
    
    # ✅ NEW: Email tracking fields
    email_sent = Column(Boolean, default=False, nullable=True)  # Changed to nullable=True for migration
    email_sent_to = Column(String(255), nullable=True)  # Recipient email address
    email_sent_at = Column(DateTime(timezone=True), nullable=True)  # When email was sent
    email_status = Column(String(50), nullable=True)  # 'sent', 'failed', 'pending', 'delivered', 'bounced'
    email_error_message = Column(Text, nullable=True)  # Error details if failed
    email_subject = Column(String(500), nullable=True)  # Subject line used
    email_delivery_id = Column(String(255), nullable=True)  # Email service provider message ID
    
    # Status tracking
    status = Column(String(50), default="pending")  # pending, submitted, completed, failed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    match = relationship("IpMatches")
    user = relationship("User")
    email_logs = relationship("EmailLog", back_populates="report", cascade="all, delete-orphan")


class EmailLog(Base):
    """
    ✅ NEW TABLE: Tracks all email sending attempts for audit trail
    Useful for debugging and showing email history to users
    """
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("dmca_reports.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Email details
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False)  # 'sent', 'failed', 'pending', 'delivered', 'bounced', 'opened'
    
    # Tracking
    provider_message_id = Column(String(255), nullable=True)  # From SendGrid/AWS SES
    error_message = Column(Text, nullable=True)
    
    # Metadata
    email_opened = Column(Boolean, default=False)  # Track if recipient opened email (if supported)
    email_opened_at = Column(DateTime(timezone=True), nullable=True)
    links_clicked = Column(Integer, default=0)  # Track engagement (if supported)
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    report = relationship("DmcaReports", back_populates="email_logs")
    user = relationship("User")