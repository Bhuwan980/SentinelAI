# scrapping/reverse_image.py

import os
import requests
import logging
from io import BytesIO
from time import sleep
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel, BlipProcessor, BlipForConditionalGeneration

from scrapping.database import save_image, save_embedding
from common.db.db import get_db
from common.config.config import settings

# ---------------------- Configuration ----------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SERP_API_KEY = settings.SERP_API_KEY
SERPAPI_SEARCH_URL = "https://serpapi.com/search"  # correct endpoint for Google reverse image
MAX_DAILY_QUERIES = 250
SLEEP_BETWEEN_QUERIES = 1  # seconds

SUPPORTED_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
SIMILARITY_THRESHOLD = 0.75  # cosine similarity threshold

# Device
device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"

# Load models
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")

# ---------------------- Helper Functions ----------------------
def generate_caption(image: Image.Image) -> str:
    inputs = blip_processor(images=image, return_tensors="pt").to(device)
    out = blip_model.generate(**inputs, max_new_tokens=30)
    return blip_processor.decode(out[0], skip_special_tokens=True)

def generate_embedding(image: Image.Image, text: str):
    inputs = clip_processor(text=[text], images=image, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        outputs = clip_model(**inputs)
    return outputs.image_embeds[0], outputs.text_embeds[0]

def cosine_similarity(a, b):
    a = a / a.norm()
    b = b / b.norm()
    return torch.dot(a, b).item()

# ---------------------- SerpApi Reverse Image Search ----------------------
def query_reverse_image(image_url: str):
    """Query Google Reverse Image Search via SerpApi."""
    params = {
        "engine": "google_reverse_image",
        "image_url": image_url,
        "api_key": SERP_API_KEY
    }
    try:
        response = requests.get(SERPAPI_SEARCH_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        results = []
        for img in data.get("images_results", []):
            url = img.get("original")
            if url and url.lower().endswith(SUPPORTED_IMAGE_EXTENSIONS):
                results.append({
                    "image_url": url,
                    "page_url": img.get("link"),
                    "page_title": img.get("title"),
                    "thumbnail_url": img.get("thumbnail"),
                    "publisher": img.get("source")
                })
        return results
    except Exception as e:
        logger.error(f"❌ Reverse image query failed: {e}")
        return []

# ---------------------- Process Results ----------------------
def process_results(results: list, db, input_image: Image.Image, input_emb, input_txt_emb):
    """Process images: generate embedding, caption, store, and check similarity."""
    match_found = False
    for img_data in results:
        img_url = img_data.get("image_url")
        if not img_url:
            continue

        # Skip duplicates in DB
        existing = db.query(save_image.__annotations__["db"].__args__[0]).filter(
            save_image.__annotations__["db"].__args__[0].image_url == img_url
        ).first()
        if existing:
            continue

        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            res = requests.get(img_url, headers=headers, timeout=10)
            res.raise_for_status()
            image = Image.open(BytesIO(res.content)).convert("RGB")

            caption = generate_caption(image)
            img_emb, txt_emb = generate_embedding(image, caption)

            # Save to DB
            img_entry = save_image(db, img_url, img_data)
            if img_entry:
                save_embedding(db, img_entry.id, img_emb.cpu().numpy(), model_name="clip-vit")

            # Check similarity
            sim_img = cosine_similarity(input_emb, img_emb)
            sim_txt = cosine_similarity(input_txt_emb, txt_emb)
            if sim_img > SIMILARITY_THRESHOLD or sim_txt > SIMILARITY_THRESHOLD:
                logger.info(f"⚠️ Match found!\nImage URL: {img_url}\nPage URL: {img_data.get('page_url')}\n"
                            f"Image Similarity: {sim_img:.2f}, Caption Similarity: {sim_txt:.2f}")
                match_found = True
            sleep(SLEEP_BETWEEN_QUERIES)

        except Exception as e:
            logger.error(f"❌ Failed processing {img_url}: {e}")

    if not match_found:
        logger.info("✅ No match found for this query.")

# ---------------------- Pipeline ----------------------
def run_pipeline(public_image_urls: list):
    db = next(get_db())
    queries_done = 0

    for img_url in public_image_urls:
        if queries_done >= MAX_DAILY_QUERIES:
            logger.warning("Reached max daily free queries.")
            break

        logger.info(f"🔍 Processing: {img_url}")

        # Download input image to generate embedding
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            res = requests.get(img_url, headers=headers, timeout=10)
            res.raise_for_status()
            input_image = Image.open(BytesIO(res.content)).convert("RGB")
        except Exception as e:
            logger.error(f"❌ Cannot fetch input image: {e}")
            continue

        # Generate embedding & caption
        caption = generate_caption(input_image)
        input_emb, input_txt_emb = generate_embedding(input_image, caption)

        # Query SerpApi Reverse Image
        results = query_reverse_image(img_url)
        if results:
            process_results(results, db, input_image, input_emb, input_txt_emb)
        else:
            logger.info("✅ No images found in reverse search.")

        queries_done += 1

    db.close()
    logger.info("✅ Pipeline finished.")

# ---------------------- Main ----------------------
if __name__ == "__main__":
    # Pass publicly accessible image URLs
    sample_urls = [
        "https://i.imgur.com/zoros.jpeg"
    ]
    run_pipeline(sample_urls)