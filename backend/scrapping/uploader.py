"""
Secure S3 image uploader for private storage with presigned URL access.

Features:
- Accepts bytes, BytesIO, or local file path as input.
- Validates files are images (jpeg, png, webp, gif).
- Stores images under: users/{user_id}/uploads/{prefix}/{uuid}.{ext}
- Keeps objects PRIVATE in the bucket and returns a presigned GET URL.
- Presigned URL TTL default: 3600 seconds (1 hour).
- Clear logging and error handling.
"""

import logging
import boto3
import uuid
import os
import imghdr
from mimetypes import guess_extension, guess_type
from typing import Optional, Union
from io import BytesIO
from pathlib import Path
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Configuration - adjust if needed
AWS_BUCKET = "sentinelai980"
AWS_REGION = "us-east-1"
PRESIGNED_URL_EXPIRATION = 3600  # seconds (1 hour)
# Allowed image types recognized by imghdr (and mapped to extensions)
_ALLOWED_IMG_TYPES = {"jpeg", "png", "gif", "webp"}

try:
    s3_client = boto3.client("s3", region_name=AWS_REGION)
except Exception as exc:
    logger.error("❌ Failed to initialize S3 client: %s", exc)
    raise


def _detect_image_extension(file_bytes: bytes, original_filename: Optional[str] = None) -> str:
    """
    Determine file extension for image bytes.
    Priority:
      1. imghdr detection from bytes
      2. extension from original filename
      3. mime type guess
      4. default to .jpg
    Returns extension including leading dot, e.g. '.jpg'
    Raises ValueError if not recognized as allowed image.
    """
    kind = imghdr.what(None, h=file_bytes)
    if kind:
        kind = kind.lower()
        if kind == "jpeg":
            return ".jpg"
        return f".{kind}"

    # fallback to original filename extension
    if original_filename:
        ext = os.path.splitext(original_filename)[1]
        if ext:
            return ext.lower()

    # fallback to mime type
    if original_filename:
        mime = guess_type(original_filename)[0]
        if mime:
            ext = guess_extension(mime.split(";")[0].strip())
            if ext:
                return ext.lower()

    # final default
    return ".jpg"


def _ensure_is_image(file_bytes: bytes, original_filename: Optional[str] = None) -> None:
    """
    Raise ValueError if bytes are not one of allowed image types.
    """
    detected = imghdr.what(None, h=file_bytes)
    if detected:
        if detected.lower() not in _ALLOWED_IMG_TYPES:
            raise ValueError(f"Unsupported image type: {detected}")
        return

    # Try filename/mime fallback
    if original_filename:
        mime = guess_type(original_filename)[0]
        if mime and mime.startswith("image/"):
            # good enough; allow it
            return

    raise ValueError("Uploaded file is not a supported image (jpeg, png, webp, gif).")


def _normalize_s3_key(s3_path: str) -> str:
    """
    Accepts:
      - 'users/1/uploads/original/xxx.jpg' (key) -> returns as-is
      - 's3://bucket/key' -> returns 'key'
      - 'https://bucket.s3.amazonaws.com/key' -> returns 'key'
      - 'https://s3.amazonaws.com/bucket/key' -> returns 'key'
    """
    if not s3_path:
        raise ValueError("s3_path is empty")

    # If it already looks like a key (no scheme)
    if not (s3_path.startswith("s3://") or s3_path.startswith("http://") or s3_path.startswith("https://")):
        return s3_path.lstrip("/")

    # s3://bucket/key
    if s3_path.startswith("s3://"):
        parts = s3_path[5:].split("/", 1)
        if len(parts) == 2:
            return parts[1]
        raise ValueError("Invalid s3:// URI")

    # https://bucket.s3.amazonaws.com/key or https://s3.amazonaws.com/bucket/key
    # Try to parse both patterns
    try:
        from urllib.parse import urlparse, unquote

        parsed = urlparse(s3_path)
        host = parsed.netloc
        path = parsed.path.lstrip("/")
        # pattern: bucket.s3.amazonaws.com/key
        if host.endswith(".amazonaws.com") and ".s3" in host:
            # host like bucket.s3.amazonaws.com
            # path is the key
            return unquote(path)
        # pattern: s3.amazonaws.com/bucket/key
        if host == "s3.amazonaws.com":
            # first component of path is bucket
            comps = path.split("/", 1)
            if len(comps) == 2:
                return unquote(comps[1])
        # fallback: return path
        return unquote(path)
    except Exception:
        # fallback naive
        return s3_path


def generate_presigned_url(s3_path: str, expiration: int = PRESIGNED_URL_EXPIRATION) -> str:
    """
    Generate a presigned GET URL for a given S3 path or key.
    s3_path may be:
      - object key: 'users/1/uploads/original/uuid.jpg'
      - s3 uri: 's3://bucket/key'
      - full https url to object
    Returns presigned URL string. Raises RuntimeError on failure.
    """
    if not s3_path:
        raise ValueError("s3_path is required")

    try:
        key = _normalize_s3_key(s3_path)
    except Exception as e:
        logger.error("Invalid s3_path given to generate_presigned_url: %s", e)
        raise RuntimeError(f"Invalid s3_path: {e}") from e

    try:
        url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": AWS_BUCKET, "Key": key},
            ExpiresIn=expiration,
        )
        logger.info("✅ Generated presigned URL for %s", key)
        return url
    except ClientError as e:
        logger.exception("❌ Presigned URL generation failed for %s: %s", key, e)
        raise RuntimeError(f"Presigned URL generation failed: {e}") from e


def upload_to_s3(
    file_data: Union[bytes, BytesIO, str],
    user_id: int,
    original_filename: Optional[str] = None,
    prefix: str = "uploads/original",
    make_presigned: bool = True,
    presigned_expiration: int = PRESIGNED_URL_EXPIRATION
) -> str:
    """
    Upload image to S3 (private) and return presigned URL (by default).
    - file_data: bytes, BytesIO, or local file path (string). HTTP URLs are NOT accepted.
    - user_id: integer user id used in key path.
    - original_filename: optional filename to help detect mime/ext.
    - prefix: subfolder (default 'uploads/original'). Leading/trailing slashes OK.
    - make_presigned: if True (default) return presigned URL; otherwise return object key.
    - presigned_expiration: TTL for presigned URL in seconds.
    """
    # Convert inputs to bytes
    if isinstance(file_data, BytesIO):
        file_bytes = file_data.getvalue()
    elif isinstance(file_data, (bytes, bytearray)):
        file_bytes = bytes(file_data)
    elif isinstance(file_data, str):
        if file_data.startswith("http://") or file_data.startswith("https://"):
            raise ValueError("upload_to_s3 cannot handle HTTP(S) URLs directly. Provide bytes or local file path.")
        path = Path(file_data)
        if not path.exists():
            raise FileNotFoundError(f"Local file not found: {file_data}")
        file_bytes = path.read_bytes()
        if original_filename is None:
            original_filename = path.name
    else:
        raise TypeError(f"Unsupported type for upload_to_s3: {type(file_data)}")

    if not file_bytes:
        raise ValueError("upload_to_s3() received empty file bytes")

    # Validate image
    try:
        _ensure_is_image(file_bytes, original_filename)
    except ValueError as e:
        logger.error("Image validation failed: %s", e)
        raise

    # Determine extension and content type
    ext = _detect_image_extension(file_bytes, original_filename)
    # prefer guessed content-type from ext
    content_type = guess_type(f"file{ext}")[0] or "image/jpeg"

    # Build S3 key
    key_prefix = prefix.strip("/")
    s3_key = f"users/{user_id}/{key_prefix}/{uuid.uuid4()}{ext}"

    try:
        s3_client.put_object(
            Bucket=AWS_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type
        )
        logger.info("✅ Uploaded to S3: %s", s3_key)
    except ClientError as e:
        logger.exception("❌ S3 upload failed for %s: %s", s3_key, e)
        raise RuntimeError(f"S3 upload failed: {e}") from e

    if make_presigned:
        return generate_presigned_url(s3_key, expiration=presigned_expiration)

    # otherwise return the s3 key
    return s3_key