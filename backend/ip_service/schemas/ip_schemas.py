from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ------------------------
# IpAsset Schemas
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
# IpEmbedding Schemas
# ------------------------
class IpEmbeddingBase(BaseModel):
    vector: List[float]   # pgvector -> list of floats
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
# IpMatch Schemas
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
# Image Schemas (scraped from web)
# ------------------------
class ImageBase(BaseModel):
    source_page_url: Optional[str] = None
    image_url: str
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
    s3_path: Optional[str] = None


class ImageCreate(ImageBase):
    pass


class ImageResponse(ImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------
# ImageEmbedding Schemas
# ------------------------
class ImageEmbeddingBase(BaseModel):
    vector: List[float]   # pgvector type
    model: Optional[str] = None


class ImageEmbeddingCreate(ImageEmbeddingBase):
    image_id: int


class ImageEmbeddingResponse(ImageEmbeddingBase):
    id: int
    image_id: int
    created_at: datetime

    class Config:
        from_attributes = True