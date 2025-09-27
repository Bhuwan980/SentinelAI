# scrapping/icrawler_image_search.py

import logging
from io import BytesIO
from time import sleep
import requests
from PIL import Image, UnidentifiedImageError
import torch
from icrawler.builtin import GoogleImageCrawler
from icrawler.downloader import Downloader
from transformers import CLIPProcessor, CLIPModel, BlipProcessor, BlipForConditionalGeneration

from scrapping.database import save_image, save_embedding
from common.db.db import get_db

# ---------------------- Config ----------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.75
device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"

# Load models
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")

# ---------------------- Helpers ----------------------
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

# ---------------------- Image Search with icrawler ----------------------
def fetch_image_urls(keyword: str, max_num: int = 20):
    urls = []

    # Proper Downloader subclass
    class URLCollectorDownloader(Downloader):
        def download(self, task, default_ext, timeout=5, **kwargs):
            urls.append(task["file_url"])
            return True  # Must return True for icrawler

    google_crawler = GoogleImageCrawler(
        feeder_threads=1,
        parser_threads=1,
        downloader_threads=1,
        downloader_cls=URLCollectorDownloader
    )

    google_crawler.crawl(keyword=keyword, max_num=max_num)
    return urls

# ---------------------- Processing ----------------------
def process_images(image_urls: list, db, input_emb, input_txt_emb):
    match_found = False

    for img_url in image_urls:
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            res = requests.get(img_url, headers=headers, timeout=10)
            res.raise_for_status()
            image = Image.open(BytesIO(res.content)).convert("RGB")

            caption = generate_caption(image)
            img_emb, txt_emb = generate_embedding(image, caption)

            # Save to DB
            img_entry = save_image(db, img_url, {"page_url": None})
            if img_entry:
                save_embedding(db, img_entry.id, img_emb.cpu().numpy(), model_name="clip-vit")

            # Check similarity
            sim_img = cosine_similarity(input_emb, img_emb)
            sim_txt = cosine_similarity(input_txt_emb, txt_emb)
            if sim_img > SIMILARITY_THRESHOLD or sim_txt > SIMILARITY_THRESHOLD:
                logger.info(f"⚠️ Match found!\nImage URL: {img_url}\nCaption: {caption}\n"
                            f"Image Sim: {sim_img:.2f}, Caption Sim: {sim_txt:.2f}")
                match_found = True
            sleep(1)

        except (requests.RequestException, UnidentifiedImageError) as e:
            logger.error(f"❌ Failed {img_url}: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error for {img_url}: {e}")

    if not match_found:
        logger.info("✅ No match found.")

# ---------------------- Pipeline ----------------------
def run_pipeline(input_url: str, keyword: str):
    db = next(get_db())

    # Load input image
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(input_url, headers=headers, timeout=10)
        res.raise_for_status()
        input_image = Image.open(BytesIO(res.content)).convert("RGB")
    except (requests.RequestException, UnidentifiedImageError) as e:
        logger.error(f"Failed to load input image: {e}")
        return
    except Exception as e:
        logger.error(f"Unexpected error loading input image: {e}")
        return

    caption = generate_caption(input_image)
    input_emb, input_txt_emb = generate_embedding(input_image, caption)

    # Crawl images from Google
    urls = fetch_image_urls(keyword, max_num=20)
    if urls:
        process_images(urls, db, input_emb, input_txt_emb)
    else:
        logger.info("No images found with icrawler.")

    db.close()

# ---------------------- Main ----------------------
if __name__ == "__main__":
    sample_url = "https://i.imgur.com/zoros.jpeg"
    run_pipeline(sample_url, keyword="zoro one piece anime")