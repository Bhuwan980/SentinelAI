# ip_service/services/dmca_service.py
import logging
import uuid
from sqlalchemy.orm import Session
from ip_service.models.ip_models import DmcaReports, IpMatches, Images, IpAssets
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def create_dmca_report(
    db: Session, 
    user_id: int, 
    match_id: int,
    scraped_data: Dict[str, Any],
    group_id: Optional[str] = None
) -> DmcaReports:
    """
    Create a comprehensive DMCA takedown report with all scraped data.
    
    Args:
        db: Database session
        user_id: User ID creating the report
        match_id: ID of the IP match
        scraped_data: Complete scraped data from SerpAPI
        group_id: Optional group ID to link related infringements
        
    Returns:
        Created DmcaReports object
    """
    try:
        # Verify match exists
        match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
        if not match:
            raise ValueError(f"Match not found: {match_id}")

        # Get source image and matched asset
        source_image = db.query(Images).filter(Images.id == match.source_image_id).first()
        matched_asset = db.query(IpAssets).filter(IpAssets.id == match.matched_asset_id).first()
        
        # Generate group ID if not provided (for grouping multiple infringements)
        if not group_id:
            group_id = str(uuid.uuid4())
        
        # Extract all important fields from scraped_data
        infringing_url = scraped_data.get("page_url") or scraped_data.get("url", "Unknown")
        suspected_image_url = scraped_data.get("suspected_image_url") or scraped_data.get("url")
        thumbnail_url = scraped_data.get("thumbnail_url") or scraped_data.get("thumbnail")
        
        # Get original image URL
        original_image_url = source_image.s3_path if source_image else None
        
        # Create comprehensive DMCA report
        report = DmcaReports(
            user_id=user_id,
            match_id=match_id,
            
            # Grouping
            original_asset_id=matched_asset.id if matched_asset else None,
            infringement_group_id=group_id,
            
            # TIER 1: Critical URLs
            infringing_url=infringing_url,
            suspected_image_url=suspected_image_url,
            original_image_url=original_image_url,
            thumbnail_url=thumbnail_url,
            screenshot_url=f"https://s3.amazonaws.com/sentinelai-dmca/screenshots/{match_id}.jpg",
            
            # Source Attribution
            source_domain=scraped_data.get("source_domain"),
            source_name=scraped_data.get("source_name"),
            page_title=scraped_data.get("page_title") or scraped_data.get("title"),
            
            # Commercial Detection
            is_product=scraped_data.get("is_product", False),
            product_price=scraped_data.get("product_price"),
            product_currency=scraped_data.get("product_currency"),
            marketplace=scraped_data.get("marketplace"),
            
            # Similarity & Position
            similarity_score=scraped_data.get("similarity_score") or scraped_data.get("similarity", 0.0),
            serp_position=scraped_data.get("serp_position") or scraped_data.get("position"),
            
            # TIER 2: Context
            page_description=scraped_data.get("page_description"),
            page_snippet=scraped_data.get("page_snippet"),
            page_author=scraped_data.get("page_author"),
            page_tags=scraped_data.get("page_tags"),
            source_logo=scraped_data.get("source_logo"),
            best_guess=scraped_data.get("best_guess"),
            
            # Image Details
            image_width=scraped_data.get("image_width"),
            image_height=scraped_data.get("image_height"),
            image_format=scraped_data.get("image_format"),
            
            # TIER 3: Raw Data (for future use)
            raw_serp_data=scraped_data.get("raw_serp_data") or scraped_data,
            
            # Legacy fields
            image_caption=scraped_data.get("caption") or matched_asset.title if matched_asset else None,
            
            # Status & Timestamps
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            detected_at=datetime.utcnow()
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(
            f"✅ Created comprehensive DMCA report id={report.id} for user_id={user_id}, "
            f"match_id={match_id}, infringing_url={infringing_url[:50]}..."
        )
        
        return report
        
    except ValueError as ve:
        logger.error(f"❌ Validation error creating DMCA report: {ve}")
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to create DMCA report for user {user_id}, match {match_id}")
        raise


def get_dmca_reports(db: Session, user_id: int, limit: int = 100) -> list:
    """Get all DMCA reports for a user."""
    try:
        reports = (
            db.query(DmcaReports)
            .filter(DmcaReports.user_id == user_id)
            .order_by(DmcaReports.created_at.desc())
            .limit(limit)
            .all()
        )
        logger.info(f"✅ Retrieved {len(reports)} DMCA reports for user {user_id}")
        return reports
    except Exception as e:
        logger.exception(f"❌ Failed to get DMCA reports for user {user_id}")
        raise


def get_grouped_dmca_reports(db: Session, user_id: int) -> Dict[str, list]:
    """
    Get DMCA reports grouped by original asset.
    
    Returns a dictionary: {asset_id: [reports]}
    """
    try:
        reports = (
            db.query(DmcaReports)
            .filter(DmcaReports.user_id == user_id)
            .order_by(DmcaReports.created_at.desc())
            .all()
        )
        
        # Group by original_asset_id
        grouped = {}
        for report in reports:
            asset_id = report.original_asset_id or "ungrouped"
            if asset_id not in grouped:
                grouped[asset_id] = []
            grouped[asset_id].append(report)
        
        logger.info(f"✅ Retrieved {len(reports)} DMCA reports in {len(grouped)} groups for user {user_id}")
        return grouped
        
    except Exception as e:
        logger.exception(f"❌ Failed to get grouped DMCA reports for user {user_id}")
        raise


def update_dmca_status(db: Session, report_id: int, status: str) -> DmcaReports:
    """Update the status of a DMCA report."""
    try:
        report = db.query(DmcaReports).filter(DmcaReports.id == report_id).first()
        if not report:
            raise ValueError(f"DMCA report not found: {report_id}")
        
        report.status = status
        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        
        logger.info(f"✅ Updated DMCA report {report_id} status to: {status}")
        return report
        
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to update DMCA report {report_id}")
        raise