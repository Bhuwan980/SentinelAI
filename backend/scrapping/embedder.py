# scrapping/embedder.py
import threading
import logging
from typing import Tuple, Optional
from PIL import Image
import torch

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ---------------------- Globals ----------------------
_clip_model: Optional[torch.nn.Module] = None
_clip_processor: Optional[object] = None
_device: Optional[str] = None
_lock = threading.Lock()

# ---------------------- Device Setup ----------------------
def _get_device() -> str:
    global _device
    if _device is None:
        _device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Embedder device set to %s", _device)
    return _device

# ---------------------- Model Loader ----------------------
def _ensure_model_loaded() -> None:
    global _clip_model, _clip_processor
    if _clip_model is not None and _clip_processor is not None:
        return
    with _lock:
        if _clip_model is not None and _clip_processor is not None:
            return
        try:
            from transformers import CLIPProcessor, CLIPModel
            model_name = "openai/clip-vit-large-patch14"  # Public, works well for digital art
            logger.info("Loading CLIP model (%s)...", model_name)
            _clip_processor = CLIPProcessor.from_pretrained(model_name)
            _clip_model = CLIPModel.from_pretrained(model_name).to(_get_device())
            logger.info("CLIP model loaded successfully.")
        except Exception:
            logger.exception("Failed to load CLIP model; embeddings will be unavailable.")

# ---------------------- Embedding Generator ----------------------
def generate_embedding(image: Image.Image, text: str, normalize: bool = True) -> Tuple[Optional[torch.Tensor], Optional[torch.Tensor]]:
    """
    Generate (image_embedding, text_embedding) as torch tensors for digital art.
    Returns (None, None) on failure.
    """
    if image is None:
        logger.warning("generate_embedding called with None image")
        return None, None

    try:
        _ensure_model_loaded()
        if _clip_model is None or _clip_processor is None:
            return None, None

        inputs = _clip_processor(text=[text or ""], images=image, return_tensors="pt", padding=True).to(_get_device())
        with torch.no_grad():
            outputs = _clip_model(**inputs)
            img_emb = outputs.image_embeds[0]
            txt_emb = outputs.text_embeds[0]

        if normalize:
            img_emb = img_emb / img_emb.norm()
            txt_emb = txt_emb / txt_emb.norm()

        return img_emb, txt_emb
    except torch.cuda.OutOfMemoryError:
        logger.exception("OOM while generating embeddings")
        return None, None
    except Exception:
        logger.exception("Unexpected error while generating embeddings")
        return None, None

# ---------------------- Cosine Similarity ----------------------
def cosine_similarity(a, b):
    a = a / a.norm()
    b = b / b.norm()
    return torch.dot(a, b).item()