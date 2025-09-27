# ip_services.py

import logging
from io import BytesIO
from typing import Dict

from scrapping.pipeline import run_pipeline

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def execute_ip_pipeline(file_bytes: bytes, keyword: str) -> Dict:
    """
    Wraps pipeline.run_pipeline for API usage.

    Args:
        file_bytes: The uploaded image file content in bytes.
        keyword: The keyword to crawl for.

    Returns:
        dict: { "success": bool, "error": Optional[str] }
    """
    try:
        # Wrap bytes into BytesIO for pipeline
        img_file = BytesIO(file_bytes)

        # Run the pipeline (is_url=False for uploaded file)
        run_pipeline(img_file, keyword, is_url=False)

        return {"success": True}
    except Exception as e:
        logger.exception("Pipeline execution failed")
        return {"success": False, "error": str(e)}