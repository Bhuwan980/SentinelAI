# scrapping/embedder.py
import threading
import logging
from typing import Tuple, Optional
from PIL import Image
import torch

logger = logging.getLogger(__name__)

_clip_model = None
_clip_processor = None
_device = None
_lock = threading.Lock()


def _get_device() -> str:
    global _device
    if _device is None:
        _device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        logger.debug("Embedder device set to %s", _device)
    return _device


def _ensure_model_loaded() -> None:
    global _clip_model, _clip_processor
    if _clip_model is not None and _clip_processor is not None:
        return
    with _lock:
        if _clip_model is not None and _clip_processor is not None:
            return
        try:
            from transformers import CLIPProcessor, CLIPModel
            logger.info("Loading CLIP model (this may take a while)...")
            _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(_get_device())
            logger.info("CLIP model loaded.")
        except Exception:
            logger.exception("Failed to load CLIP model; embedding will be unavailable.")


def generate_embedding(image: Image.Image, text: str) -> Tuple[Optional[torch.Tensor], Optional[torch.Tensor]]:
    """
    Generate (image_embedding, text_embedding) as torch tensors.
    Returns (None, None) on failure.
    """
    if image is None:
        logger.warning("generate_embedding called with None image")
        return None, None

    try:
        _ensure_model_loaded()
        if _clip_model is None or _clip_processor is None:
            logger.warning("CLIP model not available; returning (None, None).")
            return None, None

        inputs = _clip_processor(text=[text or ""], images=image, return_tensors="pt", padding=True).to(_get_device())
        with torch.no_grad():
            outputs = _clip_model(**inputs)
        return outputs.image_embeds[0], outputs.text_embeds[0]
    except torch.cuda.OutOfMemoryError:
        logger.exception("OOM while creating embeddings")
        return None, None
    except Exception:
        logger.exception("Unexpected error while generating embedding")
        return None, None


def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> Optional[float]:
    """
    Returns cosine similarity scalar or None on failure.
    """
    try:
        if a is None or b is None:
            return None
        a = a / a.norm()
        b = b / b.norm()
        return float(torch.dot(a, b).item())
    except Exception:
        logger.exception("Failed to compute cosine similarity")
        return None