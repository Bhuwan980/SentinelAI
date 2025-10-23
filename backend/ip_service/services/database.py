import logging
import os
import uuid
import json
from dataclasses import dataclass
from typing import Any, Optional, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from ip_service.models.ip_models import (
    Images,
    ImageEmbeddings,
    IpAssets,
    IpEmbeddings,
    IpMatches,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

_EMB_DIR = os.path.join(os.getcwd(), "embeddings")
os.makedirs(_EMB_DIR, exist_ok=True)

@dataclass
class TransientImageEntry:
    id: str
    url: str
    meta: dict

def save_image(db: Session, image_url: str, metadata: Dict = None, user_id: Optional[int] = None) -> Any:
    metadata = metadata or {}

    if not user_id:
        logger.error("❌ Missing user_id while saving image: %s", image_url)
        raise ValueError("user_id is required to save an image")

    existing = db.query(Images).filter(Images.image_url == image_url).first()
    if existing:
        logger.info("ℹ️ Image already exists in DB: %s", image_url)
        return existing

    try:
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
        logger.warning("❌ DB save failed, falling back to transient entry: %s", e)
        entry = TransientImageEntry(id=str(uuid.uuid4()), url=image_url, meta=metadata)
        logger.info("ℹ️ Using transient image entry: %s", entry.id)
        return entry

def save_embedding(db: Session, image: Any, vector: List, model_name: str = "clip-vit") -> Optional[ImageEmbeddings]:
    image_id = getattr(image, "id", image)
    if not image_id:
        logger.warning("⚠️ No valid image_id provided, skipping embedding save")
        return None
    try:
        vector_json = json.dumps(vector)
    except (TypeError, ValueError) as e:
        logger.error("❌ Failed to serialize vector: %s", e)
        return None
    db_emb = ImageEmbeddings(
        image_id=image_id,
        vector=vector_json,
        model=model_name,
        created_at=datetime.utcnow()
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
        try:
            emb_path = os.path.join(_EMB_DIR, f"{image_id}_{model_name}.json")
            with open(emb_path, "w") as f:
                json.dump({"image_id": image_id, "vector": vector, "model": model_name}, f)
            logger.info("✅ Saved embedding to local storage: %s", emb_path)
            return None
        except Exception as local_e:
            logger.exception("❌ Failed to save embedding to local storage: %s", local_e)
            raise

def save_ip_asset(db: Session, user_id: int, title: str, description: str = None, asset_type: str = None, file_url: str = None) -> IpAssets:
    if not user_id:
        logger.error("❌ Missing user_id while saving IP asset")
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

def save_ip_embedding(db: Session, asset_id: int, vector: List, model_name: str = "clip-vit") -> IpEmbeddings:
    try:
        vector_json = json.dumps(vector)
    except (TypeError, ValueError) as e:
        logger.error("❌ Failed to serialize vector: %s", e)
        raise
    db_emb = IpEmbeddings(
        asset_id=asset_id,
        vector=vector_json,
        model=model_name,
        created_at=datetime.utcnow()
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


# ✅ UPDATED: Now accepts scraped_data parameter
def save_ip_match(
    db: Session, 
    source_image_id: int, 
    matched_asset_id: int, 
    similarity_score: float,
    scraped_data: Optional[Dict] = None  # ✅ NEW PARAMETER
) -> IpMatches:
    """
    Save IP match with optional scraped data from SerpAPI.
    
    Args:
        db: Database session
        source_image_id: ID of the source image
        matched_asset_id: ID of the matched asset
        similarity_score: Similarity score (0.0-1.0)
        scraped_data: Complete scraped data from SerpAPI (optional)
    """
    db_match = IpMatches(
        source_image_id=source_image_id,
        matched_asset_id=matched_asset_id,
        similarity_score=similarity_score,
        scraped_data=scraped_data,  # ✅ STORE SCRAPED DATA
        created_at=datetime.utcnow()
    )
    try:
        db.add(db_match)
        db.commit()
        db.refresh(db_match)
        
        # ✅ Enhanced logging
        if scraped_data:
            logger.info(
                "✅ Saved IP match with scraped data: %s -> %s (score %.2f, page_url: %s)",
                source_image_id,
                matched_asset_id,
                similarity_score,
                scraped_data.get("page_url", "N/A")
            )
        else:
            logger.info(
                "✅ Saved IP match: %s -> %s (score %.2f) [No scraped data]",
                source_image_id,
                matched_asset_id,
                similarity_score
            )
        
        return db_match
    except Exception as e:
        db.rollback()
        logger.exception("❌ Failed to save IP match: %s", e)
        raise