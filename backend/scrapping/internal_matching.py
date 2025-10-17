# scrapping/internal_matching.py
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Union
from ip_service.models.ip_models import ImageEmbeddings, IpEmbeddings, IpMatches
from .embedder import cosine_similarity

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

INTERNAL_SIMILARITY_THRESHOLD = 0.2

def find_internal_matches(
    db: Session,
    input_vector: Union[List[float], "torch.Tensor"],
    exclude_image_id: int = None
) -> List[Dict[str, Any]]:
    """Search internal images and IP assets for similar embeddings."""

    # Convert tensor to list if needed
    if hasattr(input_vector, "detach"):
        input_vector = input_vector.detach().cpu().tolist()

    matches = []

    # 1️⃣ IP assets
    ip_assets = db.query(IpEmbeddings).all()
    for asset in ip_assets:
        sim = cosine_similarity(input_vector, asset.vector)
        if sim and sim >= INTERNAL_SIMILARITY_THRESHOLD:
            matches.append({"type": "ip_asset", "id": asset.asset_id, "similarity_score": sim})

    # 2️⃣ System-wide images
    image_embs_query = db.query(ImageEmbeddings)
    if exclude_image_id is not None:
        image_embs_query = image_embs_query.filter(ImageEmbeddings.image_id != exclude_image_id)
    image_embs = image_embs_query.all()

    for img in image_embs:
        sim = cosine_similarity(input_vector, img.vector)
        if sim and sim >= INTERNAL_SIMILARITY_THRESHOLD:
            matches.append({"type": "image", "id": img.image_id, "similarity_score": sim})

    logger.info(f"⚡ Found {len(matches)} internal matches above threshold {INTERNAL_SIMILARITY_THRESHOLD}")
    return matches

def save_internal_matches(db: Session, input_image_id: int, internal_matches: List[Dict[str, Any]]):
    """Save internal matches to DB, avoiding duplicates."""
    saved_count = 0
    for match in internal_matches:
        matched_id = match["id"]

        existing = db.query(IpMatches).filter(
            IpMatches.source_image_id == input_image_id,
            IpMatches.matched_asset_id == matched_id
        ).first()
        if existing:
            continue

        new_match = IpMatches(
            source_image_id=input_image_id,
            matched_asset_id=matched_id,
            similarity_score=match["similarity_score"],
            user_confirmed=None
        )
        db.add(new_match)
        saved_count += 1

    db.commit()
    logger.info(f"✅ Saved {saved_count} internal matches for image {input_image_id}")