# ip_service/services/database.py

import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ip_service.models.ip_models import (
    Images,
    ImageEmbeddings,
    IpAssets,
    IpEmbeddings,
    IpMatches,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ---------------------- Images ----------------------
def save_image(db: Session, image_url: str, metadata: dict = None, user_id: int = None):
    """
    Save a crawled or uploaded image to the database.

    Args:
        db: SQLAlchemy session
        image_url: URL of the image (S3 or original)
        metadata: Optional metadata dict (caption, title, etc.)
        user_id: User ID of the uploader (required)
    Returns:
        Image SQLAlchemy object
    """
    metadata = metadata or {}

    if not user_id:
        logger.error("❌ Missing user_id while saving image: %s", image_url)
        raise ValueError("user_id is required to save an image")

    # Prevent duplicate insertions
    existing = db.query(Images).filter(Images.image_url == image_url).first()
    if existing:
        logger.info("ℹ️ Image already exists in DB: %s", image_url)
        return existing

    db_image = Images(
        user_id=user_id,
        image_url=image_url,
        source_page_url=metadata.get("source_page_url"),
        domain=metadata.get("domain"),
        status_code=metadata.get("status_code"),
        content_type=metadata.get("content_type"),
        file_size_bytes=metadata.get("file_size_bytes"),
        width=metadata.get("width"),
        height=metadata.get("height"),
        page_title=metadata.get("page_title"),
        img_alt=metadata.get("img_alt"),
        s3_path=metadata.get("s3_path"),
        status="pending",
    )

    try:
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        logger.info("✅ Saved image id=%s for user_id=%s", db_image.id, user_id)
        return db_image
    except IntegrityError as e:
        db.rollback()
        logger.exception("❌ DB integrity error while saving image: %s", e)
        raise
    except Exception as e:
        db.rollback()
        logger.exception("❌ Unexpected error while saving image: %s", e)
        raise


# ---------------------- Image Embeddings ----------------------
def save_embedding(db: Session, image_id: int, vector: list, model_name: str = "clip-vit"):
    """
    Save image embedding to the database.
    """
    if not image_id:
        logger.warning("⚠️ No image_id provided, skipping embedding save")
        return None

    db_emb = ImageEmbeddings(
        image_id=image_id,
        vector=vector,
        model=model_name,
    )
    try:
        db.add(db_emb)
        db.commit()
        db.refresh(db_emb)
        logger.info("✅ Saved embedding for image_id=%s", image_id)
        return db_emb
    except Exception as e:
        db.rollback()
        logger.exception("❌ Failed to save embedding: %s", e)
        raise


# ---------------------- IP Assets ----------------------
def save_ip_asset(db: Session, user_id: int, title: str, description: str = None, asset_type: str = None, file_url: str = None):
    """
    Save a new IP asset uploaded by a user.
    """
    if not user_id:
        raise ValueError("user_id is required to save IP assets")

    db_asset = IpAssets(
        user_id=user_id,
        title=title,
        description=description,
        asset_type=asset_type,
        file_url=file_url,
    )
    try:
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
        logger.info("✅ Saved IP asset id=%s for user_id=%s", db_asset.id, user_id)
        return db_asset
    except Exception as e:
        db.rollback()
        logger.exception("❌ Failed to save IP asset: %s", e)
        raise


# ---------------------- IP Embeddings ----------------------
def save_ip_embedding(db: Session, asset_id: int, vector: list, model_name: str = "clip-vit"):
    """
    Save embedding for IP asset.
    """
    db_emb = IpEmbeddings(
        asset_id=asset_id,
        vector=vector,
        model=model_name,
    )
    try:
        db.add(db_emb)
        db.commit()
        db.refresh(db_emb)
        logger.info("✅ Saved IP embedding for asset_id=%s", asset_id)
        return db_emb
    except Exception as e:
        db.rollback()
        logger.exception("❌ Failed to save IP embedding: %s", e)
        raise


# ---------------------- IP Matches ----------------------
def save_ip_match(db: Session, source_asset_id: int, matched_asset_id: int, similarity_score: float):
    """
    Save a match between two IP assets.
    """
    db_match = IpMatches(
        source_asset_id=source_asset_id,
        matched_asset_id=matched_asset_id,
        similarity_score=similarity_score,
    )
    try:
        db.add(db_match)
        db.commit()
        db.refresh(db_match)
        logger.info("✅ Saved IP match: %s -> %s (score %.2f)", source_asset_id, matched_asset_id, similarity_score)
        return db_match
    except Exception as e:
        db.rollback()
        logger.exception("❌ Failed to save IP match: %s", e)
        raise