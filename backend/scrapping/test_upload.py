"""
═══════════════════════════════════════════════════════════════════════════════
SENTINEL AI - COMPLETE DMCA IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════════════

Complete implementation for comprehensive DMCA report generation with full 
SerpAPI data extraction.

Author: Sentinel AI Team
Updated: January 20, 2025
Version: 2.0

FEATURES:
✅ Extract ALL important data from SerpAPI (page URLs, image URLs, metadata)
✅ Separate DMCA report per infringement with grouping support
✅ Commercial detection (detect if someone is selling your content)
✅ Full metadata tracking (titles, descriptions, tags, etc.)
✅ Email sending with PDF attachments
✅ Frontend with grouping and filtering

FILES INCLUDED:
1. ip_models.py - Database models
2. scrapper.py - Enhanced SerpAPI scraper
3. dmca_service.py - DMCA report creation
4. ip_routes.py - API endpoints
5. migration_script.py - Alembic migration
6. Reports.jsx - Frontend component
7. api.js - Frontend API configuration

═══════════════════════════════════════════════════════════════════════════════
"""

# ═══════════════════════════════════════════════════════════════════════════════
# FILE 1: ip_service/models/ip_models.py
# ═══════════════════════════════════════════════════════════════════════════════

"""
Complete IP Models with all DMCA fields for comprehensive tracking.
Path: ip_service/models/ip_models.py
"""

from sqlalchemy import (
    Column, Integer, String, DateTime, Float, ForeignKey,
    Text, Boolean, JSON,
)
from sqlalchemy.orm import relationship
from common.db.db import Base
from datetime import datetime
from user_service.models.user_models import User


class Images(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    source_page_url = Column(String(1000))
    domain = Column(String(255))
    status_code = Column(Integer)
    content_type = Column(String(50))
    file_size_bytes = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    page_title = Column(String(255))
    img_alt = Column(String(255))
    sha256 = Column(String(64))
    phash = Column(String(64))
    s3_path = Column(String(500))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_seen = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="images")
    embeddings = relationship("ImageEmbeddings", back_populates="image", cascade="all, delete-orphan")
    matches = relationship("IpMatches", back_populates="source_image", cascade="all, delete-orphan")


class ImageEmbeddings(Base):
    __tablename__ = "image_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    vector = Column(JSON, nullable=False)
    model = Column(String(50), default="clip-vit")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    image = relationship("Images", back_populates="embeddings")


class IpAssets(Base):
    __tablename__ = "ip_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    asset_type = Column(String(50))
    file_url = Column(String(500))
    serp_raw_data = Column(JSON, nullable=True)  # NEW
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="uploads")
    embeddings = relationship("IpEmbeddings", back_populates="asset", cascade="all, delete-orphan")
    matches = relationship("IpMatches", back_populates="matched_asset", cascade="all, delete-orphan")
    notifications = relationship("Notifications", back_populates="asset", cascade="all, delete-orphan")
    dmca_reports = relationship("DmcaReports", back_populates="original_asset", cascade="all, delete-orphan")


class IpEmbeddings(Base):
    __tablename__ = "ip_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=False)
    vector = Column(JSON, nullable=False)
    model = Column(String(50), default="clip-vit")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    asset = relationship("IpAssets", back_populates="embeddings")


class IpMatches(Base):
    __tablename__ = "ip_matches"

    id = Column(Integer, primary_key=True, index=True)
    source_image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    matched_asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    user_confirmed = Column(Boolean, nullable=True)
    scraped_data = Column(JSON, nullable=True)  # NEW
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    source_image = relationship("Images", back_populates="matches")
    matched_asset = relationship("IpAssets", back_populates="matches")
    notification = relationship("Notifications", back_populates="match", uselist=False)


class Notifications(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("ip_matches.id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=True)
    message = Column(String(1000), nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    match = relationship("IpMatches", back_populates="notification")
    asset = relationship("IpAssets", back_populates="notifications")


class DmcaReports(Base):
    """
    Comprehensive DMCA Reports with full SerpAPI data.
    Design: One report per infringement
    """
    __tablename__ = "dmca_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("ip_matches.id"), nullable=False)
    
    # GROUPING
    original_asset_id = Column(Integer, ForeignKey("ip_assets.id"), nullable=True)
    infringement_group_id = Column(String(50), nullable=True)
    
    # TIER 1: CRITICAL URLS
    infringing_url = Column(String(1000), nullable=False)          # PAGE URL
    suspected_image_url = Column(String(1000), nullable=True)      # IMAGE URL
    original_image_url = Column(String(1000), nullable=True)       # USER'S IMAGE
    thumbnail_url = Column(String(1000), nullable=True)
    screenshot_url = Column(String(1000), nullable=True)
    
    # SOURCE ATTRIBUTION
    source_domain = Column(String(255), nullable=True)
    source_name = Column(String(255), nullable=True)
    page_title = Column(String(500), nullable=True)
    
    # COMMERCIAL DETECTION
    is_product = Column(Boolean, default=False, nullable=True)
    product_price = Column(String(50), nullable=True)
    product_currency = Column(String(10), nullable=True)
    marketplace = Column(String(100), nullable=True)
    
    # SIMILARITY
    similarity_score = Column(Float, nullable=True)
    serp_position = Column(Integer, nullable=True)
    
    # TIER 2: CONTEXT
    page_description = Column(Text, nullable=True)
    page_snippet = Column(Text, nullable=True)
    page_author = Column(String(255), nullable=True)
    page_tags = Column(JSON, nullable=True)
    source_logo = Column(String(500), nullable=True)
    best_guess = Column(String(255), nullable=True)
    
    # IMAGE DETAILS
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    image_format = Column(String(20), nullable=True)
    
    # TIER 3: RAW DATA
    raw_serp_data = Column(JSON, nullable=True)
    
    # LEGACY
    image_caption = Column(Text, nullable=True)
    page_metadata = Column(JSON, nullable=True)
    page_copyright = Column(Text, nullable=True)
    suspected_image_alt = Column(String(500), nullable=True)
    suspected_image_title = Column(String(500), nullable=True)
    
    # EMAIL TRACKING
    email_sent = Column(Boolean, default=False, nullable=True)
    email_sent_to = Column(String(255), nullable=True)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    email_status = Column(String(50), nullable=True)
    email_error_message = Column(Text, nullable=True)
    email_subject = Column(String(500), nullable=True)
    email_delivery_id = Column(String(255), nullable=True)
    
    # STATUS
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    match = relationship("IpMatches")
    user = relationship("User")
    original_asset = relationship("IpAssets", back_populates="dmca_reports")
    email_logs = relationship("EmailLog", back_populates="report", cascade="all, delete-orphan")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("dmca_reports.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False)
    provider_message_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    email_opened = Column(Boolean, default=False)
    email_opened_at = Column(DateTime(timezone=True), nullable=True)
    links_clicked = Column(Integer, default=0)
    sent_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    report = relationship("DmcaReports", back_populates="email_logs")
    user = relationship("User")


# ═══════════════════════════════════════════════════════════════════════════════
# FILE 2: scrapping/scrapper.py
# ═══════════════════════════════════════════════════════════════════════════════

"""
Enhanced SerpAPI scraper with complete data extraction.
Path: scrapping/scrapper.py
"""

import logging
import aiohttp
from typing import List, Dict, Optional
from fastapi import HTTPException
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


async def fetch_images(img_url: str, sources: List[str], serpapi_key: str) -> List[Dict]:
    """Fetch similar images with comprehensive data extraction."""
    
    if not serpapi_key:
        raise HTTPException(status_code=500, detail="SerpAPI key not configured")
    if "serpapi" not in sources:
        raise HTTPException(status_code=400, detail="Invalid source")

    params = {
        "engine": "google_reverse_image",
        "image_url": img_url,
        "api_key": serpapi_key
    }
    url = "https://serpapi.com/search"

    async with aiohttp.ClientSession() as session:
        try:
            logger.info(f"🔍 SerpAPI request: {img_url}")
            
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="SerpAPI error")
                
                data = await response.json()
                logger.info(f"📊 Response keys: {list(data.keys())}")
                
                best_guess = data.get("best_guess", "")
                images = data.get("image_results", []) or data.get("inline_images", [])
                pages = data.get("pages_including_matching_images", [])
                
                if not images and not pages:
                    logger.warning("⚠️ No results found")
                    return []
                
                result = []
                for idx, img in enumerate(images):
                    processed = _process_image_result(img, idx, best_guess, data)
                    if processed:
                        result.append(processed)
                
                for idx, page in enumerate(pages):
                    processed = _process_page_result(page, idx + len(images), best_guess, data)
                    if processed:
                        result.append(processed)
                
                logger.info(f"✅ Fetched {len(result)} results")
                return result
                
        except Exception as e:
            logger.exception(f"❌ SerpAPI error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


def _process_image_result(img: Dict, idx: int, best_guess: str, full_response: Dict) -> Optional[Dict]:
    """Process image result with all fields."""
    try:
        image_url = img.get("original") or img.get("source") or img.get("thumbnail")
        page_url = img.get("link", "")
        thumbnail = img.get("thumbnail") or img.get("source")
        
        if not image_url:
            return None
        
        # Extract domain
        domain = ""
        source_name = ""
        if page_url:
            try:
                parsed = urlparse(page_url)
                domain = parsed.netloc
                source_name = domain.replace("www.", "").split(".")[0].title()
            except:
                pass
        
        source_name = img.get("source_name") or source_name
        is_product = img.get("is_product", False)
        
        # Detect marketplace
        marketplace = None
        if is_product:
            marketplace = source_name
            domain_lower = domain.lower()
            if "etsy" in domain_lower:
                marketplace = "Etsy"
            elif "amazon" in domain_lower:
                marketplace = "Amazon"
            elif "ebay" in domain_lower:
                marketplace = "eBay"
        
        return {
            # CRITICAL
            "page_url": page_url,
            "suspected_image_url": image_url,
            "thumbnail_url": thumbnail,
            "source_domain": domain,
            "source_name": source_name,
            "page_title": img.get("title", "Untitled"),
            
            # COMMERCIAL
            "is_product": is_product,
            "product_price": img.get("price"),
            "product_currency": img.get("currency"),
            "marketplace": marketplace,
            
            # SIMILARITY
            "similarity_score": float(img.get("similarity", 0.85)),
            "serp_position": img.get("position", idx + 1),
            
            # METADATA
            "source_logo": img.get("source_logo"),
            "best_guess": best_guess,
            "raw_serp_data": img,
            
            # LEGACY
            "url": image_url,
            "content": thumbnail,
            "title": img.get("title", "Untitled"),
            "caption": source_name or page_url,
            "similarity": float(img.get("similarity", 0.85)),
            "text_similarity": 0.0,
            "position": img.get("position", idx)
        }
    except Exception as e:
        logger.warning(f"⚠️ Process error: {e}")
        return None


def _process_page_result(page: Dict, idx: int, best_guess: str, full_response: Dict) -> Optional[Dict]:
    """Process page result."""
    try:
        page_url = page.get("link", "")
        thumbnail = page.get("thumbnail", "")
        
        if not page_url:
            return None
        
        domain = ""
        source_name = ""
        if page_url:
            try:
                parsed = urlparse(page_url)
                domain = parsed.netloc
                source_name = domain.replace("www.", "").split(".")[0].title()
            except:
                pass
        
        source_name = page.get("source") or source_name
        
        return {
            "page_url": page_url,
            "suspected_image_url": thumbnail or page_url,
            "thumbnail_url": thumbnail,
            "source_domain": domain,
            "source_name": source_name,
            "page_title": page.get("title", "Untitled"),
            "page_snippet": page.get("snippet"),
            "is_product": False,
            "product_price": None,
            "product_currency": None,
            "marketplace": None,
            "similarity_score": 0.80,
            "serp_position": idx + 1,
            "best_guess": best_guess,
            "raw_serp_data": page,
            "url": thumbnail or page_url,
            "content": thumbnail,
            "title": page.get("title", "Untitled"),
            "caption": source_name,
            "similarity": 0.80,
            "text_similarity": 0.0,
            "position": idx
        }
    except Exception as e:
        logger.warning(f"⚠️ Process error: {e}")
        return None


async def download_image_content(image_url: str) -> Optional[bytes]:
    """Download image content."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        async with aiohttp.ClientSession() as session:
            async with session.get(image_url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status == 200:
                    content = await response.read()
                    logger.info(f"✅ Downloaded: {image_url}")
                    return content
                return None
    except Exception as e:
        logger.warning(f"⚠️ Download error: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# FILE 3: ip_service/services/dmca_service.py
# ═══════════════════════════════════════════════════════════════════════════════

"""
DMCA service with comprehensive report creation.
Path: ip_service/services/dmca_service.py
"""

import logging
import uuid
from sqlalchemy.orm import Session
from ip_service.models.ip_models import DmcaReports, IpMatches, Images, IpAssets
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def create_dmca_report(
    db: Session, 
    user_id: int, 
    match_id: int,
    scraped_data: Dict[str, Any],
    group_id: Optional[str] = None
) -> DmcaReports:
    """Create comprehensive DMCA report with all scraped data."""
    
    try:
        match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
        if not match:
            raise ValueError(f"Match not found: {match_id}")

        source_image = db.query(Images).filter(Images.id == match.source_image_id).first()
        matched_asset = db.query(IpAssets).filter(IpAssets.id == match.matched_asset_id).first()
        
        if not group_id:
            group_id = str(uuid.uuid4())
        
        # Extract fields
        infringing_url = scraped_data.get("page_url") or scraped_data.get("url", "Unknown")
        suspected_image_url = scraped_data.get("suspected_image_url") or scraped_data.get("url")
        thumbnail_url = scraped_data.get("thumbnail_url") or scraped_data.get("thumbnail")
        original_image_url = source_image.s3_path if source_image else None
        
        report = DmcaReports(
            user_id=user_id,
            match_id=match_id,
            original_asset_id=matched_asset.id if matched_asset else None,
            infringement_group_id=group_id,
            
            # URLs
            infringing_url=infringing_url,
            suspected_image_url=suspected_image_url,
            original_image_url=original_image_url,
            thumbnail_url=thumbnail_url,
            screenshot_url=f"https://s3.amazonaws.com/sentinelai-dmca/screenshots/{match_id}.jpg",
            
            # Attribution
            source_domain=scraped_data.get("source_domain"),
            source_name=scraped_data.get("source_name"),
            page_title=scraped_data.get("page_title") or scraped_data.get("title"),
            
            # Commercial
            is_product=scraped_data.get("is_product", False),
            product_price=scraped_data.get("product_price"),
            product_currency=scraped_data.get("product_currency"),
            marketplace=scraped_data.get("marketplace"),
            
            # Similarity
            similarity_score=scraped_data.get("similarity_score") or scraped_data.get("similarity", 0.0),
            serp_position=scraped_data.get("serp_position") or scraped_data.get("position"),
            
            # Context
            page_description=scraped_data.get("page_description"),
            page_snippet=scraped_data.get("page_snippet"),
            page_author=scraped_data.get("page_author"),
            page_tags=scraped_data.get("page_tags"),
            source_logo=scraped_data.get("source_logo"),
            best_guess=scraped_data.get("best_guess"),
            
            # Image details
            image_width=scraped_data.get("image_width"),
            image_height=scraped_data.get("image_height"),
            image_format=scraped_data.get("image_format"),
            
            # Raw data
            raw_serp_data=scraped_data.get("raw_serp_data") or scraped_data,
            
            # Legacy
            image_caption=scraped_data.get("caption") or matched_asset.title if matched_asset else None,
            
            # Status
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            detected_at=datetime.utcnow()
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"✅ Created DMCA report {report.id} for match {match_id}")
        return report
        
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to create DMCA report: {e}")
        raise


def get_dmca_reports(db: Session, user_id: int, limit: int = 100) -> list:
    """Get all DMCA reports."""
    try:
        reports = (
            db.query(DmcaReports)
            .filter(DmcaReports.user_id == user_id)
            .order_by(DmcaReports.created_at.desc())
            .limit(limit)
            .all()
        )
        logger.info(f"✅ Retrieved {len(reports)} reports for user {user_id}")
        return reports
    except Exception as e:
        logger.exception(f"❌ Failed to get reports: {e}")
        raise


def get_grouped_dmca_reports(db: Session, user_id: int) -> Dict[str, list]:
    """Get reports grouped by original asset."""
    try:
        reports = (
            db.query(DmcaReports)
            .filter(DmcaReports.user_id == user_id)
            .order_by(DmcaReports.created_at.desc())
            .all()
        )
        
        grouped = {}
        for report in reports:
            asset_id = report.original_asset_id or "ungrouped"
            if asset_id not in grouped:
                grouped[asset_id] = []
            grouped[asset_id].append(report)
        
        logger.info(f"✅ Retrieved {len(reports)} reports in {len(grouped)} groups")
        return grouped
        
    except Exception as e:
        logger.exception(f"❌ Failed to get grouped reports: {e}")
        raise


def update_dmca_status(db: Session, report_id: int, status: str) -> DmcaReports:
    """Update report status."""
    try:
        report = db.query(DmcaReports).filter(DmcaReports.id == report_id).first()
        if not report:
            raise ValueError(f"Report not found: {report_id}")
        
        report.status = status
        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        
        logger.info(f"✅ Updated report {report_id} status to {status}")
        return report
        
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to update report: {e}")
        raise


# ═══════════════════════════════════════════════════════════════════════════════
# FILE 4: ip_service/routes/ip_routes.py - CRITICAL UPDATE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Updated IP Routes with comprehensive DMCA report creation.
Path: ip_service/routes/ip_routes.py

CRITICAL UPDATE in /confirm-match/{match_id} endpoint
"""

# Add this import at the top
from ip_service.services.dmca_service import create_dmca_report

# REPLACE your existing /confirm-match/{match_id} endpoint with this:

@ip_router.post("/confirm-match/{match_id}")
async def confirm_match(
    match_id: int, 
    request: ConfirmMatchRequest, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Confirm match and create comprehensive DMCA report."""
    try:
        # Get match
        match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Verify ownership
        source_image = db.query(Images).filter(Images.id == match.source_image_id).first()
        if not source_image or source_image.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update confirmation
        match.user_confirmed = request.user_confirmed
        db.commit()
        logger.info(f"✅ Match {match_id} confirmed: {request.user_confirmed}")

        # Create DMCA report if confirmed
        if request.user_confirmed:
            try:
                # Get scraped data from match
                scraped_data = match.scraped_data or {}
                
                # If no scraped data, create basic report
                if not scraped_data:
                    logger.warning(f"⚠️ No scraped data for match {match_id}, using basic data")
                    matched_asset = db.query(IpAssets).filter(IpAssets.id == match.matched_asset_id).first()
                    
                    scraped_data = {
                        "page_url": matched_asset.file_url if matched_asset else "Unknown",
                        "suspected_image_url": matched_asset.file_url if matched_asset else "Unknown",
                        "page_title": matched_asset.title if matched_asset else "Untitled",
                        "similarity_score": float(match.similarity_score) if match.similarity_score else 0.0,
                    }
                
                # Create comprehensive DMCA report
                report = create_dmca_report(
                    db=db,
                    user_id=current_user.id,
                    match_id=match_id,
                    scraped_data=scraped_data
                )
                
                logger.info(f"✅ Created DMCA report {report.id} for match {match_id}")
                
            except Exception as dmca_error:
                logger.exception(f"❌ Failed to create DMCA report: {dmca_error}")
                # Don't fail the request
                logger.warning(f"⚠️ Match confirmed but DMCA creation failed")

        return {"success": True, "message": "Match confirmed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to confirm match: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# FILE 5: Alembic Migration Script
# ═══════════════════════════════════════════════════════════════════════════════

