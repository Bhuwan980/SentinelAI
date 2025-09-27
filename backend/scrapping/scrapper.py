# scrapping/scrapper.py
import logging
import threading
from typing import List, Set
from urllib.parse import urlparse
from icrawler.builtin import GoogleImageCrawler
from icrawler.downloader import Downloader

logger = logging.getLogger(__name__)


def _is_http_url(u: str) -> bool:
    if not u:
        return False
    try:
        p = urlparse(u)
        return p.scheme in ("http", "https")
    except Exception:
        return False


def fetch_image_urls(keyword: str, max_num: int = 20, crawl_timeout: float = 20.0) -> List[str]:
    """
    Use icrawler to collect file URLs. Defensive: uses a proper Downloader subclass,
    validates URLs, deduplicates, and returns early if the crawl thread doesn't finish
    within `crawl_timeout` seconds (returns what was gathered so far).
    """
    urls = []
    url_set: Set[str] = set()

    class URLCollectorDownloader(Downloader):
        def __init__(self, *args, **kwargs):
            # keep default initialization
            try:
                super().__init__(*args, **kwargs)
            except Exception:
                # fall back: don't break the crawler instantiation
                logger.debug("Downloader super init failed (ignored).")

        def download(self, task, default_ext, timeout=5, **kwargs):
            try:
                file_url = task.get("file_url") or task.get("url") or task.get("src")
                if file_url and _is_http_url(file_url):
                    if file_url not in url_set:
                        url_set.add(file_url)
                        urls.append(file_url)
                        # limit early if we reached max_num
                        if len(urls) >= max_num:
                            return True
                return True
            except Exception:
                logger.exception("Downloader failed processing task")
                return False

    try:
        crawler = GoogleImageCrawler(
            feeder_threads=1,
            parser_threads=1,
            downloader_threads=1,
            downloader_cls=URLCollectorDownloader
        )
    except Exception:
        logger.exception("Failed to instantiate GoogleImageCrawler")
        return []

    # run crawl in a thread so we can timeout if it hangs
    def _run_crawl():
        try:
            crawler.crawl(keyword=keyword, max_num=max_num)
        except Exception:
            logger.exception("icrawler crawl failed")

    thread = threading.Thread(target=_run_crawl, daemon=True)
    thread.start()
    thread.join(timeout=crawl_timeout)
    if thread.is_alive():
        logger.warning("Crawler thread still alive after timeout; returning results gathered so far (%d urls)", len(urls))

    # final sanitize: ensure http urls only, deduplicate and limit
    cleaned = []
    for u in urls:
        if _is_http_url(u):
            if u not in cleaned:
                cleaned.append(u)
        if len(cleaned) >= max_num:
            break

    logger.info("fetch_image_urls returning %d urls (requested %d) for keyword=%s", len(cleaned), max_num, keyword)
    return cleaned