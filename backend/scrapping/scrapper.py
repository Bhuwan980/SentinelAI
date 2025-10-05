# scrapping/scrapper.py
import logging
import time
from typing import List, Optional, Union
from pathlib import Path
import tempfile
import json

from icrawler.builtin import (
    GoogleImageCrawler,
    BingImageCrawler,
    BaiduImageCrawler,
    FlickrImageCrawler,
    GreedyImageCrawler
)

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | [%(levelname)s]: %(message)s",
    datefmt="%m-%d-%Y / %I:%M:%S %p"
)


# ---------------------- Helper Functions ----------------------
def _safe_crawl(
    crawler,
    keyword: Optional[str] = None,
    max_num: int = 50,
    delay: float = 1.0,
    domains: Optional[List[str]] = None
) -> list[str]:
    """Crawl images safely and return list of image file paths."""
    source_urls = []
    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            crawler.storage.root_dir = tmp_dir

            # Handle crawler-specific parameters
            if isinstance(crawler, FlickrImageCrawler):
                crawler.crawl(max_num=max_num)
            elif isinstance(crawler, GreedyImageCrawler):
                if not domains:
                    raise ValueError("GreedyImageCrawler requires 'domains' argument")
                crawler.crawl(domains=domains, max_num=max_num)
            else:
                crawler.crawl(keyword=keyword, max_num=max_num)

            # First try to get file_url from JSON metadata
            for meta_file in Path(tmp_dir).rglob("*.json"):
                try:
                    data = json.loads(meta_file.read_text())
                    file_url = data.get("file_url")
                    if file_url:
                        source_urls.append(file_url)
                except Exception:
                    logger.exception("Failed to parse metadata file: %s", meta_file)

            # Fallback: collect actual downloaded image files
            for img_file in Path(tmp_dir).rglob("*.*"):
                if img_file.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    source_urls.append(str(img_file))

            # Deduplicate
            source_urls = list(set(source_urls))
            logger.info("Crawled %d original source URLs/files", len(source_urls))
            time.sleep(delay)
            return source_urls

    except Exception as e:
        logger.error("Crawler failed: %s", e, exc_info=True)
        return source_urls


# ---------------------- Individual Engine Crawlers ----------------------
def fetch_google_images(keyword: str, max_num: int = 50) -> List[str]:
    try:
        crawler = GoogleImageCrawler(storage={"root_dir": "./images/google"})
        return _safe_crawl(crawler, keyword, max_num)
    except Exception as e:
        logger.error("Google fetch failed: %s", e, exc_info=True)
        return []


def fetch_bing_images(keyword: str, max_num: int = 50) -> List[str]:
    try:
        crawler = BingImageCrawler(storage={"root_dir": "./images/bing"})
        return _safe_crawl(crawler, keyword, max_num)
    except Exception as e:
        logger.error("Bing fetch failed: %s", e, exc_info=True)
        return []


def fetch_baidu_images(keyword: str, max_num: int = 50) -> List[str]:
    try:
        crawler = BaiduImageCrawler(storage={"root_dir": "./images/baidu"})
        return _safe_crawl(crawler, keyword, max_num)
    except Exception as e:
        logger.error("Baidu fetch failed: %s", e, exc_info=True)
        return []


def fetch_flickr_images(tags: str, max_num: int = 50, api_key: Optional[str] = None) -> List[str]:
    if not api_key:
        logger.warning("Flickr API key not provided; skipping Flickr fetch.")
        return []
    try:
        crawler = FlickrImageCrawler(api_key=api_key, storage={"root_dir": "./images/flickr"})
        return _safe_crawl(crawler, max_num=max_num)
    except Exception as e:
        logger.error("Flickr fetch failed: %s", e, exc_info=True)
        return []


def fetch_greedy_images(domains: Union[str, List[str]], max_num: int = 50) -> List[str]:
    """Crawl directly from a list of domains."""
    if isinstance(domains, str):
        domains = [domains]

    all_images = []
    try:
        for domain in domains:
            logger.info("Performing greedy crawl on domain: %s", domain)
            crawler = GreedyImageCrawler(storage={"root_dir": "./images/greedy"})
            all_images += _safe_crawl(crawler, max_num=max_num, domains=[domain])
    except Exception as e:
        logger.error("Greedy fetch failed: %s", e, exc_info=True)
    return all_images


# ---------------------- Multi-engine + Keyword Variations ----------------------
def fetch_images_with_variations(
    base_keywords: List[str],
    sources: Optional[List[str]] = None,
    max_num_per_source: int = 50,
    flickr_api_key: Optional[str] = None,
    greedy_domains: Optional[List[str]] = None
) -> List[str]:
    """Crawl images using multiple engines and optional greedy crawling."""
    if sources is None:
        sources = ["google", "bing", "baidu"]

    all_images = []

    for keyword in base_keywords:
        logger.info("Searching for keyword variation: '%s'", keyword)
        for src in sources:
            if src.lower() == "google":
                all_images += fetch_google_images(keyword, max_num_per_source)
            elif src.lower() == "bing":
                all_images += fetch_bing_images(keyword, max_num_per_source)
            elif src.lower() == "baidu":
                all_images += fetch_baidu_images(keyword, max_num_per_source)
            elif src.lower() == "flickr":
                all_images += fetch_flickr_images(keyword, max_num_per_source, flickr_api_key)
            else:
                logger.warning("Unknown source '%s', skipping.", src)

    # Greedy crawl
    if greedy_domains:
        all_images += fetch_greedy_images(greedy_domains, max_num_per_source)

    # Deduplicate
    unique_images = list(set(all_images))
    logger.info("Total unique images fetched: %d", len(unique_images))
    return unique_images


# ---------------------- Alias for backward compatibility ----------------------
def fetch_image_urls(
    keyword: str,
    sources=None,
    max_num: int = 20,
    flickr_api_key=None,
    greedy_domains=None
):
    return fetch_images_with_variations(
        base_keywords=[keyword],
        sources=sources,
        max_num_per_source=max_num,
        flickr_api_key=flickr_api_key,
        greedy_domains=greedy_domains
    )


fetch_image_urls_dynamic = fetch_image_urls


# ---------------------- Example Usage ----------------------
if __name__ == "__main__":
    keyword_variations = [
        "angry anime character",
        "furious anime girl",
        "mad anime boy"
    ]

    images = fetch_images_with_variations(
        base_keywords=keyword_variations,
        sources=["google", "bing", "baidu"],
        max_num_per_source=10,
        greedy_domains=["deviantart.com", "pixiv.net"]
    )
    print(f"Fetched {len(images)} images.")