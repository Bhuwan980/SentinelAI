# scrapping/pipeline.py
import logging
from io import BytesIO
from pathlib import Path
from time import sleep
from typing import Union, List, Optional

import requests
from PIL import Image, UnidentifiedImageError

from .uploader import generate_presigned_url, upload_to_s3
from .captioner import generate_caption
from .embedder import generate_embedding, cosine_similarity
from .scrapper import fetch_image_urls_dynamic
from ip_service.services.database import save_image, save_embedding
from common.db.db import get_db

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

SIMILARITY_THRESHOLD = 0.99  # similarity threshold to consider duplicates
MAX_IMAGES_PER_SOURCE = 50  # max images to fetch per source

# ---------------------- Image Loading ----------------------
def safe_load_image(file: Union[str, BytesIO]) -> Optional[Image.Image]:
    """Load image from file path, URL, or BytesIO object safely."""
    try:
        if isinstance(file, str):
            if file.startswith("http"):
                resp = requests.get(file, timeout=10)
                resp.raise_for_status()
                return Image.open(BytesIO(resp.content)).convert("RGB")
            else:
                return Image.open(file).convert("RGB")
        else:
            return Image.open(file).convert("RGB")
    except UnidentifiedImageError:
        logger.error("Could not identify image: %s", file)
        return None
    except Exception:
        logger.exception("Unexpected error loading image")
        return None

# ---------------------- Image Processing ----------------------
def process_images(
    image_urls: list[str],
    db,
    input_img_emb,
    input_txt_emb,
    user_id: int,
    max_per_run: int = 50
):
    """Process crawled images, generate embeddings, and save to DB."""
    matches = []
    session = requests.Session()

    for i, img_url in enumerate(image_urls):
        if i >= max_per_run:
            logger.info("Reached max_per_run=%d; stopping", max_per_run)
            break
        try:
            # If the URL is not an HTTP link, generate presigned URL
            if not img_url.startswith("http"):
                img_url = generate_presigned_url(img_url)
                if not img_url:
                    logger.warning("Skipping image, failed to get presigned URL")
                    continue

            resp = session.get(img_url, timeout=10)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content)).convert("RGB")

            caption = generate_caption(img)
            img_emb, txt_emb = generate_embedding(img, caption)

            # Save image metadata
            img_entry = save_image(db, img_url, {"caption": caption}, user_id=user_id)
            if img_emb is not None:
                save_embedding(db, getattr(img_entry, "id", None), img_emb, model_name="clip-vit")

            # Compute similarity with user-uploaded image
            sim_img = cosine_similarity(input_img_emb, img_emb)
            sim_txt = cosine_similarity(input_txt_emb, txt_emb)
            if (sim_img and sim_img >= SIMILARITY_THRESHOLD) or (sim_txt and sim_txt >= SIMILARITY_THRESHOLD):
                logger.info("⚠️ Match found! URL: %s | ImgSim: %.2f | TxtSim: %.2f", img_url, sim_img, sim_txt)
                matches.append({
                    "url": img_url,
                    "caption": caption,
                    "image_similarity": sim_img,
                    "text_similarity": sim_txt
                })

        except Exception:
            logger.exception("Error processing image %s", img_url)

    return matches

# ---------------------- Pipeline Runner ----------------------
def run_pipeline(
    user_image: Union[str, BytesIO],
    user_id: int,
    sources: Optional[List[str]] = None,
    max_crawl: int = 20,
    flickr_api_key: Optional[str] = None,
    greedy_domains: Optional[List[str]] = None
):
    """
    Complete duplicate detection pipeline for a user.

    Steps:
    1. Load user image
    2. Generate caption & embeddings
    3. Upload user image to S3 in user-specific folder
    4. Save original image metadata
    5. Fetch related images from multiple sources
    6. Process images, generate embeddings, and detect matches
    7. Return matches
    """
    db = next(get_db())
    sources = sources or ["google", "bing"]

    # Load user image
    input_image = safe_load_image(user_image)
    if input_image is None:
        return {"success": False, "error": "Could not load input image"}

    # Generate caption & embeddings
    caption = generate_caption(input_image) or "image"
    input_img_emb, input_txt_emb = generate_embedding(input_image, caption)
    if input_img_emb is None or input_txt_emb is None:
        return {"success": False, "error": "Failed to generate embeddings for input image"}

    # Upload image to S3 under user-specific folder
    try:
        if isinstance(user_image, (str, BytesIO)):
            if isinstance(user_image, str) and user_image.startswith("http"):
                input_url = user_image
            else:
                file_bytes = user_image.read() if isinstance(user_image, BytesIO) else Path(user_image).read_bytes()
                input_url = upload_to_s3(file_bytes, user_id=user_id, prefix="uploads")
                logger.info("Uploaded input image for user %d: %s", user_id, input_url)
        else:
            input_url = None
    except Exception as e:
        input_url = None
        logger.warning("Upload failed: %s", e)

    # Save metadata of the uploaded image
    save_image(db, input_url, {"caption": caption}, user_id=user_id)

    # Fetch related images
    crawled_urls = fetch_image_urls_dynamic(
        caption,
        sources=sources,
        max_num=max_crawl,
        flickr_api_key=flickr_api_key,
        greedy_domains=greedy_domains
    )

    # Process crawled images
    matches = process_images(crawled_urls, db, input_img_emb, input_txt_emb, user_id=user_id, max_per_run=max_crawl)

    return {"success": True, "matches": matches}

# ---------------------- CLI Test ----------------------
if __name__ == "__main__":
    # Test with URL
    result = run_pipeline("https://i.imgur.com/zoros.jpeg", user_id=1)
    print(result)

    # Test with local file
    with open("local_zoro.jpg", "rb") as f:
        result = run_pipeline(f, user_id=1)
        print(result)