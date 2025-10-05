# scrapping/captioner.py
import threading
import logging
from typing import Optional
from PIL import Image, UnidentifiedImageError
import torch

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ---------------------- Globals ----------------------
_blip_model = None
_blip_processor = None
_device = None
_lock = threading.Lock()
_model_name = "Salesforce/blip-image-captioning-base"  # Public, lightweight model

# ---------------------- Device Setup ----------------------
def _get_device() -> str:
    global _device
    if _device is None:
        _device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Captioner device set to %s", _device)
    return _device

# ---------------------- Model Loader ----------------------
def _ensure_model_loaded() -> None:
    """
    Load BLIP image captioning model.
    """
    global _blip_model, _blip_processor
    if _blip_model is not None and _blip_processor is not None:
        return

    with _lock:
        if _blip_model is not None and _blip_processor is not None:
            return

        try:
            from transformers import BlipProcessor, BlipForConditionalGeneration

            logger.info("Loading BLIP caption model: %s ...", _model_name)
            _blip_processor = BlipProcessor.from_pretrained(_model_name)
            _blip_model = BlipForConditionalGeneration.from_pretrained(_model_name).to(_get_device())
            logger.info("BLIP model loaded successfully: %s", _model_name)

        except Exception:
            logger.exception("Failed to load BLIP model; captions will be unavailable.")

# ---------------------- Caption Generator ----------------------
def generate_caption(image: Image.Image, max_new_tokens: int = 30) -> str:
    """
    Generate a caption for a PIL Image.
    Returns empty string on failure (so downstream pipeline can continue).
    """
    if image is None:
        logger.warning("generate_caption called with None image")
        return ""

    try:
        _ensure_model_loaded()
        if _blip_model is None or _blip_processor is None:
            logger.warning("BLIP model not loaded; returning empty caption.")
            return ""

        # Prepare inputs
        inputs = _blip_processor(images=image, return_tensors="pt").to(_get_device())
        outputs = _blip_model.generate(**inputs, max_new_tokens=max_new_tokens)
        caption = _blip_processor.decode(outputs[0], skip_special_tokens=True)

        if not caption:
            logger.warning("BLIP returned empty caption")
            return ""
        return caption

    except UnidentifiedImageError:
        logger.exception("PIL could not identify the image for captioning")
        return ""
    except torch.cuda.OutOfMemoryError:
        logger.exception("Out of memory while generating caption")
        return ""
    except Exception:
        logger.exception("Unexpected error during caption generation")
        return ""