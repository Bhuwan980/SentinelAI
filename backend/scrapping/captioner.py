# scrapping/captioner.py
import threading
import logging
from typing import Optional
from PIL import Image, UnidentifiedImageError
import torch

logger = logging.getLogger(__name__)

# Lazy model globals + lock
_blip_model = None
_blip_processor = None
_device = None
_lock = threading.Lock()


def _get_device() -> str:
    global _device
    if _device is None:
        _device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        logger.debug("Captioner device set to %s", _device)
    return _device


def _ensure_model_loaded() -> None:
    global _blip_model, _blip_processor
    if _blip_model is not None and _blip_processor is not None:
        return
    with _lock:
        if _blip_model is not None and _blip_processor is not None:
            return
        try:
            from transformers import BlipProcessor, BlipForConditionalGeneration
            logger.info("Loading BLIP caption model (this may take a while)...")
            _blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            _blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(_get_device())
            logger.info("BLIP model loaded.")
        except Exception:
            logger.exception("Failed to load BLIP model; captioning will be unavailable.")
            # don't raise - we prefer graceful degradation


def generate_caption(image: Image.Image, max_new_tokens: int = 30) -> str:
    """
    Generate caption for a Pillow Image object.
    Returns empty string on failure (so downstream code can continue).
    """
    if image is None:
        logger.warning("generate_caption called with None image")
        return ""

    try:
        _ensure_model_loaded()
        if _blip_model is None or _blip_processor is None:
            logger.warning("BLIP model not loaded; returning empty caption.")
            return ""

        # prepare and generate
        inputs = _blip_processor(images=image, return_tensors="pt").to(_get_device())
        out = _blip_model.generate(**inputs, max_new_tokens=max_new_tokens)
        caption = _blip_processor.decode(out[0], skip_special_tokens=True)
        return caption or ""
    except UnidentifiedImageError:
        logger.exception("PIL could not identify the image for captioning")
        return ""
    except torch.cuda.OutOfMemoryError:
        logger.exception("OOM while captioning image")
        return ""
    except Exception:
        logger.exception("Unexpected error during caption generation")
        return ""