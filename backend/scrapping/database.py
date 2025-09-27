# scrapping/database.py
import logging
import os
import json
import uuid
from dataclasses import dataclass
from typing import Any, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Local fallback storage for embeddings if DB save fails
_EMB_DIR = os.path.join(os.getcwd(), "embeddings")
os.makedirs(_EMB_DIR, exist_ok=True)


@dataclass
class TransientImageEntry:
    id: str
    url: str
    meta: dict


def save_image(db: Any, url: str, meta: dict) -> Optional[Any]:
    """
    Try to save an image record using the provided DB object.
    If DB isn't available or the call fails, return a TransientImageEntry (id=uuid).
    Designed to be defensive and not raise.
    """
    try:
        if db is None:
            logger.warning("No DB session provided to save_image; returning transient entry.")
            return TransientImageEntry(id=str(uuid.uuid4()), url=url, meta=meta or {})

        # Common extension points: prefer a db method if present
        if hasattr(db, "save_image"):
            try:
                return db.save_image(url=url, meta=meta or {})
            except Exception:
                logger.exception("db.save_image failed; falling back to other strategies")

        # Try SQLAlchemy-style session with Image model if available
        try:
            from common.db.models import Image as ImageModel  # optional
            img = ImageModel(url=url, meta=json.dumps(meta or {}))
            db.add(img)
            db.commit()
            db.refresh(img)
            return img
        except Exception:
            logger.debug("Could not save via common.db.models.Image (maybe not present).")

        # fallback transient entry
        return TransientImageEntry(id=str(uuid.uuid4()), url=url, meta=meta or {})
    except Exception:
        logger.exception("save_image encountered an unexpected error")
        return None


def save_embedding(db: Any, image_id: Any, emb: Any, model_name: str = "clip-vit") -> Optional[str]:
    """
    Try to store 'emb' (numpy array or list) in DB. If the DB doesn't expose a method, save locally as a .npy file.
    Returns the DB identifier / path on success, or None on failure.
    """
    try:
        if emb is None:
            logger.warning("save_embedding called with None emb; skipping")
            return None

        # If db has a dedicated method
        if db is not None and hasattr(db, "save_embedding"):
            try:
                return db.save_embedding(image_id=image_id, embedding=emb, model_name=model_name)
            except Exception:
                logger.exception("db.save_embedding failed; falling back to local save")

        # Convert to numpy array if it's a torch tensor
        try:
            import torch
            if isinstance(emb, torch.Tensor):
                emb_np = emb.cpu().numpy()
            else:
                emb_np = np.asarray(emb)
        except Exception:
            try:
                emb_np = np.asarray(emb)
            except Exception:
                logger.exception("Could not convert embedding to numpy array; aborting save")
                return None

        fname = f"{image_id or 'noid'}_{model_name}_{uuid.uuid4().hex}.npy"
        path = os.path.join(_EMB_DIR, fname)
        try:
            np.save(path, emb_np)
            logger.info("Saved fallback embedding to %s", path)
            return path
        except Exception:
            logger.exception("Failed to write embedding to disk")
            return None

    except Exception:
        logger.exception("Unexpected error in save_embedding")
        return None