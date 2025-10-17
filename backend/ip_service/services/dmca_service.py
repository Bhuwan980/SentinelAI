import logging
from sqlalchemy.orm import Session
from ip_service.models.ip_models import DmcaReports, IpMatches, Images, IpAssets
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Import metadata scraper
try:
    from scrapping.metadata_scrapper import extract_page_metadata, format_metadata_for_display
    METADATA_SCRAPER_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ Metadata scraper not available")
    METADATA_SCRAPER_AVAILABLE = False

def create_dmca_report(db: Session, user_id: int, report_data: Dict[str, Any]) -> DmcaReports:
    """
    Create a DMCA takedown report.
    
    Args:
        db: Database session
        user_id: User ID creating the report
        report_data: Dictionary containing:
            - match_id: ID of the IP match
            - infringing_url: URL of the infringing content
            - screenshot_url: URL of screenshot evidence
            - original_image_url: URL of original image
            - image_caption: Caption/description
            - similarity_score: Match similarity score
            - status: Report status (default: 'pending')
            
    Returns:
        Created DmcaReports object
    """
    try:
        match_id = report_data.get("match_id")
        if not match_id:
            raise ValueError("match_id is required in report_data")
        
        # Verify match exists
        match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
        if not match:
            raise ValueError(f"Match not found: {match_id}")

        # Get source image for additional context
        image = db.query(Images).filter(Images.id == match.source_image_id).first()
        
        # Create DMCA report with all fields
        report = DmcaReports(
            user_id=user_id,
            match_id=match_id,
            infringing_url=report_data.get("infringing_url", "Unknown source"),
            screenshot_url=report_data.get(
                "screenshot_url",
                f"https://s3.amazonaws.com/sentinelai-dmca/screenshots/{match_id}.jpg"
            ),
            status=report_data.get("status", "pending"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"✅ Created DMCA report id={report.id} for user_id={user_id}, match_id={match_id}")
        
        # Optional: Send email notification
        try:
            _send_dmca_notification(report, image, report_data)
        except Exception as email_error:
            logger.warning(f"⚠️ Failed to send DMCA email notification: {email_error}")
            # Don't fail the report creation if email fails
        
        return report
        
    except ValueError as ve:
        logger.error(f"❌ Validation error creating DMCA report: {ve}")
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to create DMCA report for user {user_id}")
        raise


def _send_dmca_notification(report: DmcaReports, image: Images, report_data: Dict[str, Any]):
    """
    Send DMCA notification email (optional feature).
    Implements basic email sending - replace with your actual email service.
    """
    try:
        # Import email utility if available
        # from common.utils.email import send_email
        
        original_url = report_data.get("original_image_url", image.image_url if image else "N/A")
        similarity_score = report_data.get("similarity_score", 0.0)
        image_caption = report_data.get("image_caption", "No caption")
        
        email_body = f"""
Dear Hosting Provider,

This is an official DMCA takedown notice.

Report ID: {report.id}
Match ID: {report.match_id}

Original work: {original_url}
Infringing work: {report.infringing_url}
Image description: {image_caption}
Similarity score: {similarity_score:.2f}

Screenshot evidence: {report.screenshot_url}

Reported by: User ID {report.user_id}
Date: {report.created_at}

This content infringes on copyrighted material. We request immediate removal.

Regards,
SentinelAI Automated DMCA Agent
"""
        
        # Uncomment when email service is available:
        # send_email(
        #     to="dmca@hostingsite.com",
        #     subject=f"DMCA Takedown Notice - Report {report.id}",
        #     body=email_body
        # )
        
        logger.info(f"📧 DMCA email prepared for report {report.id}")
        
    except Exception as e:
        logger.warning(f"⚠️ Could not send DMCA email: {e}")
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