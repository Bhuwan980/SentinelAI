# ip_service/models/ip_models.py
"""
Complete IP Models with all DMCA fields for comprehensive tracking.
Updated: 2025-01-20
"""

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
    
    # Store complete SerpAPI response for this asset
    serp_raw_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="uploads")
    embeddings = relationship("IpEmbeddings", back_populates="asset", cascade="all, delete-orphan")
    matches = relationship("IpMatches", back_populates="matched_asset", cascade="all, delete-orphan")
    notifications = relationship("Notifications", back_populates="asset", cascade="all, delete-orphan")
    dmca_reports = relationship("DmcaReports", back_populates="original_asset", cascade="all, delete-orphan")


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

    status = Column(String(50), default="pending", nullable=False)  # 'pending', 'confirmed', 'declined'
    reviewed_at = Column(DateTime(timezone=True), nullable=True)   # When user reviewed the match
    
    # Store the complete scraped data for this specific match
    scraped_data = Column(JSON, nullable=True)
    
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
    """
    Comprehensive DMCA Reports with full SerpAPI data extraction.
    
    Design: One report per infringement (separate tracking)
    Grouping: Use original_asset_id and infringement_group_id
    """
    __tablename__ = "dmca_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("ip_matches.id"), nullable=False)
    
    # ===== GROUPING FIELDS =====
    original_asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=True)
    infringement_group_id = Column(String(50), nullable=True)  # UUID for grouping multiple infringements
    
    # ===== TIER 1: CRITICAL FIELDS =====
    # URLs - The actual locations
    infringing_url = Column(String(1000), nullable=False)        # ✅ PAGE URL where image is used
    suspected_image_url = Column(String(1000), nullable=True)    # ✅ Direct image URL
    original_image_url = Column(String(1000), nullable=True)     # ✅ User's original image S3 URL
    thumbnail_url = Column(String(1000), nullable=True)          # ✅ Preview thumbnail
    screenshot_url = Column(String(1000), nullable=True)         # ✅ Screenshot evidence
    
    # Source Attribution
    source_domain = Column(String(255), nullable=True)           # ✅ example.com
    source_name = Column(String(255), nullable=True)             # ✅ Website/company name
    page_title = Column(String(500), nullable=True)              # ✅ Page title
    
    # Commercial Detection - CRITICAL for IP protection
    is_product = Column(Boolean, default=False, nullable=True)   # ✅ Is it being sold?
    product_price = Column(String(50), nullable=True)            # ✅ Price if selling
    product_currency = Column(String(10), nullable=True)         # ✅ USD, EUR, etc.
    marketplace = Column(String(100), nullable=True)             # ✅ Etsy, Amazon, eBay, etc.
    
    # Similarity & Position
    similarity_score = Column(Float, nullable=True)              # ✅ Match confidence (0.0-1.0)
    serp_position = Column(Integer, nullable=True)               # ✅ Search result rank
    
    # ===== TIER 2: IMPORTANT FIELDS =====
    # Context & Description
    page_description = Column(Text, nullable=True)               # ✅ Page meta description
    page_snippet = Column(Text, nullable=True)                   # ✅ Search result snippet
    page_author = Column(String(255), nullable=True)             # ✅ Content author
    
    # Metadata
    page_tags = Column(JSON, nullable=True)                      # ✅ Array of keywords/tags
    source_logo = Column(String(500), nullable=True)             # ✅ Website favicon/logo URL
    best_guess = Column(String(255), nullable=True)              # ✅ Google's image identification
    
    # Image Technical Details
    image_width = Column(Integer, nullable=True)                 # ✅ Image width in pixels
    image_height = Column(Integer, nullable=True)                # ✅ Image height in pixels
    image_format = Column(String(20), nullable=True)             # ✅ jpg, png, webp, etc.
    
    # ===== TIER 3: RAW DATA & DEBUG =====
    raw_serp_data = Column(JSON, nullable=True)                  # ✅ Complete SerpAPI response
    
    # ===== LEGACY FIELDS (Keep for compatibility) =====
    image_caption = Column(Text, nullable=True)
    page_metadata = Column(JSON, nullable=True)
    page_copyright = Column(Text, nullable=True)
    suspected_image_alt = Column(String(500), nullable=True)
    suspected_image_title = Column(String(500), nullable=True)
    
    # ===== EMAIL TRACKING =====
    email_sent = Column(Boolean, default=False, nullable=True)
    email_sent_to = Column(String(255), nullable=True)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    email_status = Column(String(50), nullable=True)             # 'sent', 'failed', 'pending', 'delivered'
    email_error_message = Column(Text, nullable=True)
    email_subject = Column(String(500), nullable=True)
    email_delivery_id = Column(String(255), nullable=True)
    
    # ===== STATUS & TIMESTAMPS =====
    status = Column(String(50), default="pending")               # pending, sent, resolved, rejected
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    match = relationship("IpMatches")
    user = relationship("User")
    original_asset = relationship("IpAssets", back_populates="dmca_reports")
    email_logs = relationship("EmailLog", back_populates="report", cascade="all, delete-orphan")


class EmailLog(Base):
    """
    Comprehensive email tracking for DMCA reports.
    Tracks all email attempts, delivery status, and engagement.
    """
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("dmca_reports.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Email details
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False)  # 'sent', 'failed', 'pending', 'delivered', 'bounced', 'opened'
    
    # Provider tracking
    provider_message_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Engagement metrics
    email_opened = Column(Boolean, default=False)
    email_opened_at = Column(DateTime(timezone=True), nullable=True)
    links_clicked = Column(Integer, default=0)
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    report = relationship("DmcaReports", back_populates="email_logs")
    user = relationship("User")