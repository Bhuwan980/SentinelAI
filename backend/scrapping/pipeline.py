# scrapping/pipeline.py
import logging
from io import BytesIO
from PIL import Image, UnidentifiedImageError
import requests
from typing import Optional, Union
from time import sleep

from .captioner import generate_caption
from .embedder import generate_embedding, cosine_similarity
from .scrapper import fetch_image_urls
from .database import save_image, save_embedding
from common.db.db import get_db

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

SIMILARITY_THRESHOLD = 0.95

# ---------------------- Image Loading ----------------------
def safe_fetch_image(url: str, session: requests.Session, min_bytes: int = 200) -> Optional[Image.Image]:
    """Fetch image from URL safely with retries and minimum size check."""
    try:
        resp = session.get(url, timeout=10)
        resp.raise_for_status()
        content = resp.content
        if not content or len(content) < min_bytes:
            logger.warning("Image too small or empty from URL: %s", url)
            return None
        img = Image.open(BytesIO(content)).convert("RGB")
        return img
    except Exception:
        logger.exception("Failed to fetch image from URL: %s", url)
        return None


def safe_load_local_image(file: Union[str, BytesIO]) -> Optional[Image.Image]:
    """Load image from file path or file-like object."""
    try:
        if isinstance(file, str):  # file path
            img = Image.open(file).convert("RGB")
        else:  # BytesIO or UploadFile.file
            img = Image.open(file).convert("RGB")
        return img
    except UnidentifiedImageError:
        logger.error("Could not identify local image")
        return None
    except Exception:
        logger.exception("Unexpected error loading local image")
        return None

# ---------------------- Image Processing ----------------------
def process_images(image_urls, db, input_emb, input_txt_emb, max_per_run=50):
    """Process crawled images: generate captions, embeddings, save to DB, check similarity."""
    match_found = False
    session = requests.Session()

    for i, img_url in enumerate(image_urls):
        if i >= max_per_run:
            logger.info("Reached max_per_run=%d; stopping", max_per_run)
            break
        try:
            image = safe_fetch_image(img_url, session)
            if image is None:
                continue

            caption = generate_caption(image)
            img_emb, txt_emb = generate_embedding(image, caption)

            # Save to DB
            img_entry = save_image(db, img_url, {"page_url": None, "caption": caption})
            if img_entry is None:
                logger.warning("Image saving failed for %s; continuing", img_url)

            if img_emb is not None:
                try:
                    save_embedding(db, getattr(img_entry, "id", None), img_emb, model_name="clip-vit")
                except Exception:
                    logger.exception("Failed saving embedding for %s", img_url)

            # Similarity check
            sim_img = cosine_similarity(input_emb, img_emb)
            sim_txt = cosine_similarity(input_txt_emb, txt_emb)
            if (sim_img and sim_img > SIMILARITY_THRESHOLD) or (sim_txt and sim_txt > SIMILARITY_THRESHOLD):
                logger.info("⚠️ Match found!\nImage URL: %s\nCaption: %s\nImage Sim: %.2f, Caption Sim: %.2f",
                            img_url, caption, sim_img, sim_txt)
                match_found = True

            sleep(1)

        except Exception:
            logger.exception("Unexpected error processing %s", img_url)

    if not match_found:
        logger.info("✅ No match found in processed images.")

# ---------------------- Pipeline Runner ----------------------
def run_pipeline(input_source: Union[str, BytesIO], keyword: str, max_crawl: int = 20, is_url: bool = True):
    """
    Run full pipeline on URL or uploaded file.
    input_source: str URL or BytesIO / UploadFile.file
    is_url: True for URL, False for file
    """
    db = None
    try:
        try:
            db = next(get_db())
        except Exception:
            logger.warning("DB unavailable, continuing without persistent saves")
            db = None

        # Load input image
        if is_url:
            session = requests.Session()
            input_image = safe_fetch_image(input_source, session)
        else:
            input_image = safe_load_local_image(input_source)

        if input_image is None:
            logger.error("Failed to load input image; aborting pipeline.")
            return {"success": False, "error": "Input image could not be loaded."}

        caption = generate_caption(input_image)
        input_emb, input_txt_emb = generate_embedding(input_image, caption)

        urls = fetch_image_urls(keyword, max_num=max_crawl)
        if not urls:
            logger.info("No images fetched for keyword=%s", keyword)
            return {"success": False, "error": "No images fetched from scrapper."}

        process_images(urls, db, input_emb, input_txt_emb)
        return {"success": True}

    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                pass


# ---------------------- CLI Test ----------------------
if __name__ == "__main__":
    # URL test
    run_pipeline("https://i.imgur.com/zoros.jpeg", keyword="zoro one piece anime", is_url=True)

    # Local file test
    with open("local_zoro.jpg", "rb") as f:
        run_pipeline(f, keyword="zoro one piece anime", is_url=False)