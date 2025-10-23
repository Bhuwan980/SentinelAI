from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ------------------------
# IP Asset Schemas
# ------------------------
class IpAssetBase(BaseModel):
    title: str
    description: Optional[str] = None
    asset_type: Optional[str] = None  
    file_url: Optional[str] = None

class IpAssetCreate(IpAssetBase):
    user_id: int

class IpAssetResponse(IpAssetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True  

# ------------------------
# IP Embedding Schemas
# ------------------------
class IpEmbeddingBase(BaseModel):
    vector: List[float]
    model: Optional[str] = None

class IpEmbeddingCreate(IpEmbeddingBase):
    asset_id: int

class IpEmbeddingResponse(IpEmbeddingBase):
    id: int
    asset_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ------------------------
# IP Match Schemas
# ------------------------
class IpMatchBase(BaseModel):
    similarity_score: float

class IpMatchCreate(IpMatchBase):
    source_asset_id: int
    matched_asset_id: int

class IpMatchResponse(IpMatchBase):
    id: int
    source_asset_id: int
    matched_asset_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ------------------------
# Image Schemas (Scraped / Uploaded by User)
# ------------------------
class ImageBase(BaseModel):
    user_id: int
    source_page_url: Optional[str] = None
    image_url: str
    storage_path: Optional[str] = None  # S3 folder path: user_{id}/...
    domain: Optional[str] = None
    status_code: Optional[int] = None
    content_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    page_title: Optional[str] = None
    img_alt: Optional[str] = None
    sha256: Optional[str] = None
    phash: Optional[str] = None
    status: Optional[str] = "pending"

class ImageCreate(ImageBase):
    pass

class ImageResponse(ImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ------------------------
# Image Embedding Schemas
# ------------------------
class ImageEmbeddingBase(BaseModel):
    vector: List[float]
    model: Optional[str] = None

class ImageEmbeddingCreate(ImageEmbeddingBase):
    image_id: int

class ImageEmbeddingResponse(ImageEmbeddingBase):
    id: int
    image_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: int
    source_image_id: int
    matched_asset_id: int
    matched_image_url: Optional[str]
    similarity_score: float
    user_confirmed: Optional[bool]
    created_at: datetime

    class Config:
        from_attributes = True


