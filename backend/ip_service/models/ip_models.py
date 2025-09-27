# models/ip_model.py
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from common.db.db import Base
from pgvector.sqlalchemy import Vector

# ------------------------
# IpAssets (unchanged except vector type)
# ------------------------
class IpAssets(Base):
    __tablename__ = "ip_assets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    asset_type = Column(String(50), nullable=True)
    file_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    embeddings = relationship("IpEmbeddings", back_populates="asset", cascade="all, delete-orphan")
    matches_as_source = relationship("IpMatches", foreign_keys="[IpMatches.source_asset_id]", back_populates="source_asset", cascade="all, delete-orphan")
    matches_as_target = relationship("IpMatches", foreign_keys="[IpMatches.matched_asset_id]", back_populates="matched_asset", cascade="all, delete-orphan")

class IpEmbeddings(Base):
    __tablename__ = "ip_embeddings"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("ip_assets.id", ondelete="CASCADE"), nullable=False)
    vector = Column(Vector(512), nullable=False)   # <--- pgvector column
    model = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("IpAssets", back_populates="embeddings")

class IpMatches(Base):
    __tablename__ = "ip_matches"
    id = Column(Integer, primary_key=True, index=True)
    source_asset_id = Column(Integer, ForeignKey("ip_assets.id", ondelete="CASCADE"), nullable=False)
    matched_asset_id = Column(Integer, ForeignKey("ip_assets.id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source_asset = relationship("IpAssets", foreign_keys=[source_asset_id], back_populates="matches_as_source")
    matched_asset = relationship("IpAssets", foreign_keys=[matched_asset_id], back_populates="matches_as_target")


# ------------------------
# Scraped images
# ------------------------
class Images(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    source_page_url = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=False, unique=True)
    domain = Column(String(255), nullable=True)
    status_code = Column(Integer, nullable=True)
    content_type = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    page_title = Column(String(255), nullable=True)
    img_alt = Column(String(255), nullable=True)
    username = Column(String(255), nullable=True)
    sha256 = Column(String(64), nullable=True, unique=True, index=True)
    phash = Column(String(16), nullable=True, index=True)
    s3_path = Column(String(500), nullable=True)
    status = Column(String(32), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    embeddings = relationship("ImageEmbeddings", back_populates="image", cascade="all, delete-orphan")

class ImageEmbeddings(Base):
    __tablename__ = "image_embeddings"
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    vector = Column(Vector(512), nullable=False)    # <--- pgvector column
    model = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    image = relationship("Images", back_populates="embeddings")