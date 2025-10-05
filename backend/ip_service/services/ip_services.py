import logging
from io import BytesIO
from typing import Dict, Optional
from sqlalchemy.orm import Session
from scrapping.pipeline import run_pipeline
from ip_service.models.ip_models import Images
from common.db.db import get_db

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def execute_ip_pipeline(file_bytes: bytes, user_id: int, keyword: Optional[str] = None) -> Dict:
    """
    Run the IP detection pipeline for a specific user.
    """
    try:
        img_file = BytesIO(file_bytes)
        db = next(get_db())

        result = run_pipeline(
            user_image=img_file,
            user_id=user_id,  # pass user_id to pipeline
            sources=["google", "bing", "baidu"],
            max_crawl=20,
            flickr_api_key=None,
            greedy_domains=["deviantart.com", "pixiv.net"]
        )

        return result

    except Exception as e:
        logger.exception("Pipeline execution failed")
        return {"success": False, "error": str(e)}