import io
import hashlib
from urllib.parse import urlparse

import requests
import numpy as np
from PIL import Image
import imagehash
import torch
import clip
from sqlalchemy.orm import Session

from models.ip_models import Images, ImageEmbeddings  # update import path if needed

# ------------------------
# Config
# ------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# ------------------------
# Helper functions
# ------------------------
def download_image(url: str, timeout=20):
    headers = {"User-Agent": "SentinelAIBot/1.0 (+mailto:you@domain.com)"}
    r = requests.get(url, headers=headers, timeout=timeout)
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", None)


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def compute_phash(img: Image.Image) -> str:
    return str(imagehash.phash(img))


def compute_clip_embedding(img: Image.Image) -> np.ndarray:
    img_input = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        emb = model.encode_image(img_input).float()
    emb = emb / emb.norm(dim=-1, keepdim=True)  # normalize
    return emb.cpu().numpy()[0].astype(np.float32)


# ------------------------
# Main service functions
# ------------------------
def insert_image(db: Session, metadata: dict, embedding: np.ndarray = None) -> Images:
    """
    Insert image record into DB using SQLAlchemy models.
    """
    img = Images(
        source_page_url=metadata.get("source_page_url"),
        image_url=metadata.get("image_url"),
        domain=metadata.get("domain"),
        status_code=metadata.get("status_code"),
        content_type=metadata.get("content_type"),
        file_size_bytes=metadata.get("file_size_bytes"),
        width=metadata.get("width"),
        height=metadata.get("height"),
        page_title=metadata.get("page_title"),
        img_alt=metadata.get("img_alt"),
        sha256=metadata.get("sha256"),
        phash=metadata.get("phash"),
        s3_path=metadata.get("s3_path")
    )
    db.add(img)
    db.commit()
    db.refresh(img)

    # Insert embedding if available
    if embedding is not None:
        img_emb = ImageEmbeddings(
            image_id=img.id,
            vector=embedding.tolist(),  # store as list
            model="CLIP-ViT-B/32"
        )
        db.add(img_emb)
        db.commit()
        db.refresh(img_emb)

    return img


def process_image_url(db: Session, image_url: str, source_page_url: str = None) -> Images | None:
    """
    Download, process, compute embedding, and insert into DB.
    """
    try:
        content, content_type = download_image(image_url)
        sha = sha256_bytes(content)
        img = Image.open(io.BytesIO(content)).convert("RGB")
        width, height = img.size
        phash = compute_phash(img)
        embedding = compute_clip_embedding(img)

        metadata = {
            "source_page_url": source_page_url,
            "image_url": image_url,
            "domain": urlparse(image_url).netloc,
            "status_code": 200,
            "content_type": content_type,
            "file_size_bytes": len(content),
            "width": width,
            "height": height,
            "page_title": None,
            "img_alt": None,
            "sha256": sha,
            "phash": phash,
            "s3_path": None
        }

        inserted_image = insert_image(db, metadata, embedding)
        return inserted_image

    except Exception as e:
        print(f"Failed to process {image_url}: {e}")
        return None