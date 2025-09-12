from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ------------------------
# IpAsset Schemas
# ------------------------
class IpAssetBase(BaseModel):
    title: str
    description: Optional[str] = None
    asset_type: Optional[str] = None  # e.g., image, text, video, code
    file_url: Optional[str] = None


class IpAssetCreate(IpAssetBase):
    user_id: int


class IpAssetResponse(IpAssetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2


# ------------------------
# IpEmbedding Schemas
# ------------------------
class IpEmbeddingBase(BaseModel):
    vector: str  # keep as string; can be JSON or pgvector later
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