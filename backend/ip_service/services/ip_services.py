import logging
from io import BytesIO
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Dict
from scrapping.pipeline import run_pipeline

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def execute_ip_pipeline(file_bytes: bytes, user_id: int, filename: str, db: Session) -> Dict:
    """
    Run the IP detection pipeline for a specific user.
    Returns a dictionary with at least 'success' key.
    """
    try:
        if not file_bytes:
            return {"success": False, "error": "Empty file received"}

        # Convert bytes to a file-like object
        img_file = BytesIO(file_bytes)

        # Call the pipeline
        result = await run_pipeline(file=img_file, user_id=user_id, filename=filename, db=db)

        # Ensure result is always a dict
        if result is None:
            logger.warning("run_pipeline returned None, converting to error dict")
            result = {"success": False, "error": "Pipeline returned None"}

        if not isinstance(result, dict):
            logger.warning("run_pipeline returned non-dict result, converting to dict")
            result = {"success": False, "error": str(result)}

        return result

    except Exception as e:
        logger.exception("Pipeline execution failed")
        return {"success": False, "error": str(e)}