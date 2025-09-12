from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from common.db.db import Base


class IpAssets(Base):
    __tablename__ = "ip_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # linked to users table
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    asset_type = Column(String(50), nullable=True)  # image, text, video, code
    file_url = Column(String(500), nullable=True)   # S3 or other storage
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    embeddings = relationship("IpEmbeddings", back_populates="asset", cascade="all, delete-orphan")
    matches_as_source = relationship("IpMatches", foreign_keys="[IpMatches.source_asset_id]", back_populates="source_asset", cascade="all, delete-orphan")
    matches_as_target = relationship("IpMatches", foreign_keys="[IpMatches.matched_asset_id]", back_populates="matched_asset", cascade="all, delete-orphan")


class IpEmbeddings(Base):
    __tablename__ = "ip_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("ip_assets.id", ondelete="CASCADE"), nullable=False)
    vector = Column(Text, nullable=False)  # can later be migrated to pgvector
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