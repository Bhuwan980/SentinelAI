# scrapping/uploader.py
import boto3
import logging
import uuid
import os
from mimetypes import guess_extension, guess_type

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

AWS_BUCKET = "sentinelai980"
AWS_REGION = "us-east-1"

s3_client = boto3.client("s3", region_name=AWS_REGION)

def _get_file_extension(content_type: str, original_filename: str = None) -> str:
    """Resolve file extension from content type or fallback to original filename."""
    if original_filename:
        ext = os.path.splitext(original_filename)[1]
        if ext:
            return ext.lower()
    if content_type:
        ext = guess_extension(content_type.split(";")[0].strip())
        if ext:
            return ext.lower()
    return ".jpg"  # fallback

def upload_to_s3(file_bytes: bytes, user_id: int, original_filename: str = None, prefix: str = "uploads/original") -> str:
    """
    Upload user file to S3 in a user-specific folder.

    Path example:
        users/{user_id}/uploads/original/{uuid}.{ext}

    Returns:
        str: The S3 key (not full URL).
    """
    # Detect file extension
    content_type = guess_type(original_filename or "")[0] if original_filename else None
    ext = _get_file_extension(content_type, original_filename)

    # Build S3 key
    key = f"users/{user_id}/{prefix}/{uuid.uuid4()}{ext}"

    try:
        s3_client.put_object(
            Bucket=AWS_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=content_type or "application/octet-stream",
        )
        logger.info("Uploaded to S3: %s", key)
        return key
    except Exception as e:
        logger.exception("Failed to upload to S3")
        raise Exception(f"S3 upload failed: {e}")

def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate presigned URL to access private S3 object."""
    try:
        url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": AWS_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except Exception as e:
        logger.exception("Failed to generate presigned URL")
        return ""