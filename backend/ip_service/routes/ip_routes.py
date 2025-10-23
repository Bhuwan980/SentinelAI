# ip_service/routes/ip_routes.py - FINAL FIXED VERSION
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import traceback
import uuid

import logging
from pydantic import BaseModel
from reportlab.pdfgen import canvas
from datetime import datetime

from ip_service.services.ip_services import execute_ip_pipeline
from ip_service.services.dmca_service import create_dmca_report
from common.auth.auth import get_current_user
from common.db.db import get_db
from ip_service.models.ip_models import Images, IpMatches, DmcaReports, IpAssets
from ip_service.schemas.ip_schemas import MatchResponse
from user_service.models.user_models import User
from scrapping.uploader import generate_presigned_url
from pydantic import EmailStr
from ip_service.services.email_service import send_dmca_email, validate_email_config
from ip_service.models.ip_models import EmailLog
from dotenv import load_dotenv
load_dotenv()


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
ip_router = APIRouter()

# ===== REQUEST MODELS =====
class ConfirmMatchRequest(BaseModel):
    user_confirmed: bool

class ReviewMatchRequest(BaseModel):
    """Request model for reviewing matches (confirm or decline)"""
    action: str  # 'confirm' or 'decline'

class SendReportRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    additional_message: Optional[str] = None


# ===== HELPER FUNCTIONS =====
def extract_id(obj) -> Optional[int]:
    """
    Safely extract ID from an object or return the ID if it's already an int.
    
    Args:
        obj: Either an integer ID or an object with an 'id' attribute
        
    Returns:
        Integer ID or None if extraction fails
    """
    if obj is None:
        return None
    if isinstance(obj, int):
        return obj
    if hasattr(obj, 'id'):
        return obj.id
    logger.warning(f"⚠️ Could not extract ID from object of type {type(obj)}")
    return None


def safe_generate_url(path: Optional[str], placeholder: str = "https://via.placeholder.com/300?text=Image+Not+Available") -> str:
    """
    Safely generate a presigned URL or return placeholder.
    
    Args:
        path: S3 path or URL
        placeholder: Default placeholder image URL
        
    Returns:
        Generated URL or placeholder
    """
    try:
        if path:
            return generate_presigned_url(path)
        return placeholder
    except Exception as e:
        logger.warning(f"⚠️ Failed to generate URL for path {path}: {e}")
        return placeholder


# ======================
# UPLOAD & RUN PIPELINE
# ======================
@ip_router.post("/run-pipeline")
async def run_pipeline_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload an image and detect potential IP matches."""
    try:
        # Validate file
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        logger.info(f"📤 Processing file upload for user {current_user.id}: {file.filename}")

        # Execute pipeline with exception handling
        try:
            result = await execute_ip_pipeline(file_bytes, current_user.id, file.filename, db)
        except Exception as pipeline_error:
            logger.exception(f"❌ Pipeline execution failed for user {current_user.id}")
            raise HTTPException(
                status_code=500, 
                detail=f"Pipeline execution failed: {str(pipeline_error)}"
            )

        # Validate pipeline result
        if not result:
            raise HTTPException(status_code=500, detail="Pipeline returned no result")
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown pipeline error")
            logger.error(f"❌ Pipeline failed: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Pipeline failed: {error_msg}")

        # Extract and validate image_id (CRITICAL FIX)
        image_id_raw = result.get("image_id")
        if not image_id_raw:
            raise HTTPException(status_code=500, detail="Pipeline succeeded but no image ID returned")
        
        # Convert to actual integer ID
        image_id = extract_id(image_id_raw)
        if not image_id:
            logger.error(f"❌ Could not extract valid image ID from result: {type(image_id_raw)}")
            raise HTTPException(status_code=500, detail="Invalid image ID format returned from pipeline")

        logger.info(f"✅ Pipeline completed successfully. Image ID: {image_id}")

        # Fetch matches safely with proper ID
        try:
            matches_query = db.query(IpMatches).filter(IpMatches.source_image_id == image_id).all()
        except Exception as query_error:
            logger.exception(f"❌ Failed to query matches for image_id {image_id}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve matches: {str(query_error)}")

        # Build matches response safely
        matches = []
        for m in matches_query:
            try:
                matched_url = "https://via.placeholder.com/300?text=Image+Not+Available"
                source_url = None
                
                if m.matched_asset and m.matched_asset.file_url:
                    matched_url = safe_generate_url(m.matched_asset.file_url)
                
                # Extract source URL from scraped_data if available
                if m.scraped_data and isinstance(m.scraped_data, dict):
                    source_url = m.scraped_data.get('link') or m.scraped_data.get('source')
                
                matches.append({
                    "id": m.id,
                    "matched_asset_id": m.matched_asset_id,
                    "matched_image_url": matched_url,
                    "source_url": source_url,
                    "similarity_score": float(m.similarity_score) if m.similarity_score else 0.0,
                    "user_confirmed": m.user_confirmed,
                    "status": getattr(m, 'status', 'pending'),
                    "created_at": m.created_at.isoformat() if m.created_at else None
                })
            except Exception as match_error:
                logger.warning(f"⚠️ Failed to process match {m.id}: {match_error}")
                continue

        return {
            "success": True,
            "image_id": image_id,
            "matches": matches
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("❌ Unexpected error in /run-pipeline")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# ==================
# LIST MY IMAGES
# ==================
@ip_router.get("/my-images")
def get_my_images(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get all images uploaded by the current user."""
    try:
        images = db.query(Images).filter(Images.user_id == current_user.id).all()
        
        result = []
        for img in images:
            try:
                url = safe_generate_url(img.s3_path)
                result.append({
                    "id": img.id,
                    "image_url": url,
                    "page_title": img.page_title or "Untitled",
                    "created_at": img.created_at.isoformat() if img.created_at else None
                })
            except Exception as img_error:
                logger.warning(f"⚠️ Failed to process image {img.id}: {img_error}")
                continue
        
        logger.info(f"✅ Retrieved {len(result)} images for user {current_user.id}")
        return {"images": result}
        
    except Exception as e:
        logger.exception(f"❌ Failed to fetch images for user {current_user.id}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch images: {str(e)}")


# ===========================
# GET MATCHES (PENDING ONLY)
# ===========================
@ip_router.get("/matches/{image_id}")
def get_matches(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ONLY pending matches for a specific image.
    Confirmed/declined matches are moved to history.
    """
    try:
        # Verify image belongs to user
        image = db.query(Images).filter(
            Images.id == image_id,
            Images.user_id == current_user.id
        ).first()
        
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Get ONLY pending matches (filter out reviewed ones)
        try:
            matches_query = db.query(IpMatches).filter(
                IpMatches.source_image_id == image_id,
                IpMatches.status == 'pending'
            ).all()
        except Exception as status_error:
            # Fallback if status column doesn't exist yet
            logger.warning(f"⚠️ Status column might not exist yet, fetching all matches: {status_error}")
            matches_query = db.query(IpMatches).filter(
                IpMatches.source_image_id == image_id
            ).all()
        
        matches = []
        for m in matches_query:
            try:
                # Get matched asset details
                matched_url = "https://via.placeholder.com/300?text=Image+Not+Available"
                source_url = None
                
                if m.matched_asset:
                    if m.matched_asset.file_url:
                        matched_url = safe_generate_url(m.matched_asset.file_url)
                    
                    # Extract source URL from scraped_data if available
                    if m.scraped_data and isinstance(m.scraped_data, dict):
                        source_url = m.scraped_data.get('link') or m.scraped_data.get('source')
                
                matches.append({
                    "id": m.id,
                    "matched_asset_id": m.matched_asset_id,
                    "matched_image_url": matched_url,
                    "source_url": source_url,
                    "similarity_score": float(m.similarity_score) if m.similarity_score else 0.0,
                    "status": getattr(m, 'status', 'pending'),
                    "created_at": m.created_at.isoformat() if m.created_at else None
                })
            except Exception as match_error:
                logger.warning(f"⚠️ Failed to process match {m.id}: {match_error}")
                continue
        
        logger.info(f"✅ Retrieved {len(matches)} pending matches for image {image_id}")
        return {"matches": matches}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Failed to get matches for image {image_id}")
        raise HTTPException(status_code=500, detail=f"Failed to get matches: {str(e)}")


# ================================
# CONFIRM OR DECLINE MATCH
# ================================
@ip_router.post("/confirm-match/{match_id}")
def confirm_or_decline_match(
    match_id: int,
    request: ReviewMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Review a match - confirm (generate DMCA) or decline (move to history).
    Accepts: { "action": "confirm" } or { "action": "decline" }
    """
    try:
        # Validate action
        if request.action not in ['confirm', 'decline']:
            raise HTTPException(
                status_code=400,
                detail="Invalid action. Must be 'confirm' or 'decline'"
            )
        
        # Get match and verify ownership
        match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Verify the match belongs to the current user
        source_image = db.query(Images).filter(
            Images.id == match.source_image_id,
            Images.user_id == current_user.id
        ).first()
        
        if not source_image:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if already reviewed
        try:
            if hasattr(match, 'status') and match.status != 'pending':
                return {
                    "success": True,
                    "message": f"Match already {match.status}",
                    "status": match.status
                }
        except:
            pass
        
        # Update match status
        try:
            match.status = request.action + 'ed'  # 'confirmed' or 'declined'
            match.reviewed_at = datetime.utcnow()
        except Exception as status_error:
            logger.warning(f"⚠️ Status column might not exist yet: {status_error}")
        
        match.user_confirmed = (request.action == 'confirm')
        
        # If confirmed, generate DMCA report
        if request.action == 'confirm':
            try:
                logger.info(f"🎯 Generating DMCA report for match {match_id}")
                
                # ✅ FIXED: Try multiple call patterns for create_dmca_report
                try:
                    # Pattern 1: (match_id, scraped_data, db, user_id)
                    dmca_report = create_dmca_report(
                        match_id=match.id,
                        scraped_data=match.scraped_data or {},
                        db=db,
                        user_id=current_user.id
                    )
                except TypeError as e1:
                    logger.warning(f"⚠️ Pattern 1 failed: {e1}")
                    try:
                        # Pattern 2: (match, db)
                        dmca_report = create_dmca_report(match, db)
                    except TypeError as e2:
                        logger.warning(f"⚠️ Pattern 2 failed: {e2}")
                        try:
                            # Pattern 3: Full kwargs
                            dmca_report = create_dmca_report(
                                user_id=current_user.id,
                                match_id=match.id,
                                source_image_id=match.source_image_id,
                                matched_asset_id=match.matched_asset_id,
                                similarity_score=match.similarity_score,
                                scraped_data=match.scraped_data or {},
                                db=db
                            )
                        except TypeError as e3:
                            logger.warning(f"⚠️ Pattern 3 failed: {e3}")
                            # Pattern 4: Just required params
                            dmca_report = create_dmca_report(
                                match_id=match.id,
                                scraped_data=match.scraped_data or {}
                            )
                
                logger.info(f"✅ DMCA report {dmca_report.id} created for match {match_id}")
                
                db.commit()
                
                return {
                    "success": True,
                    "message": "Match confirmed and DMCA report generated",
                    "status": "confirmed",
                    "dmca_report_id": dmca_report.id,
                    "match_id": match_id
                }
                
            except Exception as dmca_error:
                logger.exception(f"❌ Failed to generate DMCA report: {dmca_error}")
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Match confirmed but DMCA generation failed: {str(dmca_error)}"
                )
        
        # If declined, just update status
        else:
            db.commit()
            logger.info(f"✅ Match {match_id} declined by user {current_user.id}")
            
            return {
                "success": True,
                "message": "Match declined and moved to history",
                "status": "declined",
                "match_id": match_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to review match {match_id}")
        raise HTTPException(status_code=500, detail=f"Failed to review match: {str(e)}")


# =========================
# GET MATCH HISTORY
# =========================
@ip_router.get("/match-history")
def get_match_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = None
):
    """
    Get all reviewed matches (confirmed and declined) for the current user.
    This is the 'Review History' page.
    """
    try:
        # Build query for user's images
        user_image_ids = db.query(Images.id).filter(
            Images.user_id == current_user.id
        ).subquery()
        
        # Get all reviewed matches (not pending)
        try:
            query = db.query(IpMatches).filter(
                IpMatches.source_image_id.in_(user_image_ids),
                IpMatches.status.in_(['confirmed', 'declined'])
            )
            
            # Optional status filter
            if status and status in ['confirmed', 'declined']:
                query = query.filter(IpMatches.status == status)
            
            # Order by review date (most recent first)
            matches_query = query.order_by(IpMatches.reviewed_at.desc()).all()
            
        except Exception as status_error:
            # Fallback if status column doesn't exist yet
            logger.warning(f"⚠️ Status column might not exist yet, using user_confirmed: {status_error}")
            query = db.query(IpMatches).filter(
                IpMatches.source_image_id.in_(user_image_ids),
                IpMatches.user_confirmed.isnot(None)
            )
            matches_query = query.order_by(IpMatches.created_at.desc()).all()
        
        # Build response
        history = []
        for m in matches_query:
            try:
                # Get matched asset details
                matched_url = "https://via.placeholder.com/300?text=Image+Not+Available"
                source_url = None
                
                if m.matched_asset:
                    if m.matched_asset.file_url:
                        matched_url = safe_generate_url(m.matched_asset.file_url)
                    
                    # Extract source URL from scraped_data
                    if m.scraped_data and isinstance(m.scraped_data, dict):
                        source_url = m.scraped_data.get('link') or m.scraped_data.get('source')
                
                # Determine status
                match_status = getattr(m, 'status', None)
                if not match_status:
                    match_status = 'confirmed' if m.user_confirmed else 'declined'
                
                history.append({
                    "id": m.id,
                    "original_image_id": m.source_image_id,
                    "matched_asset_id": m.matched_asset_id,
                    "matched_image_url": matched_url,
                    "source_url": source_url,
                    "similarity_score": float(m.similarity_score) if m.similarity_score else 0.0,
                    "status": match_status,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                    "reviewed_at": getattr(m, 'reviewed_at', m.created_at).isoformat() if hasattr(m, 'reviewed_at') else m.created_at.isoformat(),
                    "updated_at": getattr(m, 'reviewed_at', m.created_at).isoformat() if hasattr(m, 'reviewed_at') else m.created_at.isoformat(),
                })
            except Exception as match_error:
                logger.warning(f"⚠️ Failed to process history match {m.id}: {match_error}")
                continue
        
        logger.info(f"✅ Retrieved {len(history)} history matches for user {current_user.id}")
        return {
            "matches": history,
            "history": history,
            "total": len(history)
        }
        
    except Exception as e:
        logger.exception(f"❌ Failed to get match history for user {current_user.id}")
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")


# ========================
# GET MATCH STATS
# ========================
@ip_router.get("/match-stats")
def get_match_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get match statistics for the current user."""
    try:
        # Get user's image IDs
        user_image_ids = db.query(Images.id).filter(
            Images.user_id == current_user.id
        ).subquery()
        
        try:
            # Count by status
            pending_count = db.query(IpMatches).filter(
                IpMatches.source_image_id.in_(user_image_ids),
                IpMatches.status == 'pending'
            ).count()
            
            confirmed_count = db.query(IpMatches).filter(
                IpMatches.source_image_id.in_(user_image_ids),
                IpMatches.status == 'confirmed'
            ).count()
            
            declined_count = db.query(IpMatches).filter(
                IpMatches.source_image_id.in_(user_image_ids),
                IpMatches.status == 'declined'
            ).count()
            
        except Exception as status_error:
            # Fallback if status column doesn't exist yet
            logger.warning(f"⚠️ Status column might not exist yet, using user_confirmed: {status_error}")
            
            all_matches = db.query(IpMatches).filter(
                IpMatches.source_image_id.in_(user_image_ids)
            ).all()
            
            pending_count = sum(1 for m in all_matches if m.user_confirmed is None)
            confirmed_count = sum(1 for m in all_matches if m.user_confirmed == True)
            declined_count = sum(1 for m in all_matches if m.user_confirmed == False)
        
        total_count = pending_count + confirmed_count + declined_count
        
        return {
            "total": total_count,
            "pending": pending_count,
            "confirmed": confirmed_count,
            "declined": declined_count,
            "reviewed": confirmed_count + declined_count
        }
        
    except Exception as e:
        logger.exception(f"❌ Failed to get match stats for user {current_user.id}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


# ======================
# DMCA REPORTS
# ======================
@ip_router.get("/dmca/reports")
def get_dmca_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all DMCA reports for the current user."""
    try:
        reports = db.query(DmcaReports).filter(
            DmcaReports.user_id == current_user.id
        ).order_by(DmcaReports.created_at.desc()).all()
        
        result = []
        for report in reports:
            try:
                result.append({
                    "id": report.id,
                    "match_id": report.match_id,
                    "infringing_url": report.infringing_url,
                    "source_domain": report.source_domain,
                    "source_name": report.source_name,
                    "similarity_score": float(report.similarity_score) if report.similarity_score else 0.0,
                    "is_product": report.is_product,
                    "product_price": report.product_price,
                    "status": report.status or "pending",
                    "email_sent": report.email_sent or False,
                    "created_at": report.created_at.isoformat() if report.created_at else None,
                    "detected_at": report.detected_at.isoformat() if report.detected_at else None,
                })
            except Exception as report_error:
                logger.warning(f"⚠️ Failed to process report {report.id}: {report_error}")
                continue
        
        logger.info(f"✅ Retrieved {len(result)} DMCA reports for user {current_user.id}")
        return {"reports": result}
        
    except Exception as e:
        logger.exception(f"❌ Failed to fetch DMCA reports for user {current_user.id}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")


@ip_router.post("/dmca/report/{report_id}/send-email")
async def send_dmca_report_email(
    report_id: int,
    request: SendReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a DMCA report via email."""
    try:
        # Validate email configuration
        email_config_valid, config_message = validate_email_config()
        if not email_config_valid:
            raise HTTPException(
                status_code=500,
                detail=f"Email service not configured: {config_message}"
            )
        
        # Get report and verify ownership
        report = db.query(DmcaReports).filter(
            DmcaReports.id == report_id,
            DmcaReports.user_id == current_user.id
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found or access denied")
        
        # Send email
        email_result = await send_dmca_email(
            report=report,
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            sender_name=current_user.full_name or current_user.username,
            sender_email=current_user.email,
            additional_message=request.additional_message
        )
        
        if email_result.get("success"):
            # Update report with email info
            report.email_sent = True
            report.email_sent_to = request.recipient_email
            report.email_sent_at = datetime.utcnow()
            report.email_status = "sent"
            report.email_subject = f"DMCA Takedown Notice - Report #{report_id}"
            report.updated_at = datetime.utcnow()
            
            # Create email log entry
            email_log = EmailLog(
                report_id=report.id,
                user_id=current_user.id,
                recipient_email=request.recipient_email,
                subject=f"DMCA Takedown Notice - Report #{report_id}",
                status="sent",
                sent_at=datetime.utcnow()
            )
            db.add(email_log)
            
            db.commit()
            db.refresh(report)
            
            logger.info(f"✅ Email sent and logged for report {report_id}")
            
            return {
                "success": True,
                "message": f"DMCA report sent successfully to {request.recipient_email}",
                "report_id": report_id,
                "sent_to": request.recipient_email,
                "sent_at": email_result["sent_at"]
            }
        else:
            # Email failed - log the error
            report.email_status = "failed"
            report.email_error_message = email_result.get("error", "Unknown error")
            report.updated_at = datetime.utcnow()
            
            # Create failed email log
            email_log = EmailLog(
                report_id=report.id,
                user_id=current_user.id,
                recipient_email=request.recipient_email,
                subject=f"DMCA Takedown Notice - Report #{report_id}",
                status="failed",
                error_message=email_result.get("error"),
                sent_at=datetime.utcnow()
            )
            db.add(email_log)
            
            db.commit()
            
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send email: {email_result.get('message', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to send DMCA email for report {report_id}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )


@ip_router.get("/dmca/report/{report_id}/download")
def download_dmca_report(
    report_id: int, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Download DMCA report with comprehensive metadata."""
    try:
        # Get report and verify ownership
        report = db.query(DmcaReports).filter(
            DmcaReports.id == report_id, 
            DmcaReports.user_id == current_user.id
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found or access denied")

        # Generate PDF using enhanced generator
        try:
            from ip_service.services.dmca_pdf_generator import generate_dmca_pdf
            
            pdf_path = generate_dmca_pdf(report)
            
            logger.info(f"✅ Generated enhanced PDF for report {report_id}")
            return FileResponse(
                pdf_path, 
                filename=f"dmca_report_{report_id}.pdf",
                media_type="application/pdf"
            )
            
        except ImportError:
            # Fallback to basic PDF generation
            logger.warning("⚠️ Enhanced PDF generator not available, using basic generation")
            pdf_path = f"/tmp/dmca_report_{report_id}.pdf"
            
            c = canvas.Canvas(pdf_path)
            y = 750
            
            # Header
            c.setFont("Helvetica-Bold", 18)
            c.drawString(100, y, f"DMCA Takedown Notice - Report ID: {report.id}")
            y -= 40
            
            # Basic Info
            c.setFont("Helvetica", 11)
            c.drawString(100, y, f"Status: {report.status or 'pending'}")
            y -= 20
            c.drawString(100, y, f"Created: {report.created_at or 'N/A'}")
            y -= 40
            
            # Original Work
            c.setFont("Helvetica-Bold", 13)
            c.drawString(100, y, "Original Copyrighted Work:")
            y -= 25
            c.setFont("Helvetica", 10)
            c.drawString(120, y, f"URL: {report.original_image_url or 'N/A'}")
            y -= 20
            c.drawString(120, y, f"Caption: {report.image_caption or 'N/A'}")
            y -= 40
            
            # Infringing Content Section
            c.setFont("Helvetica-Bold", 13)
            c.drawString(100, y, "Infringing Content:")
            y -= 25
            c.setFont("Helvetica", 10)
            c.drawString(120, y, f"Page URL: {report.infringing_url or 'N/A'}")
            y -= 15
            c.drawString(120, y, f"Image URL: {report.suspected_image_url or 'N/A'}")
            y -= 15
            c.drawString(120, y, f"Source Domain: {report.source_domain or 'N/A'}")
            y -= 15
            c.drawString(120, y, f"Website: {report.source_name or 'N/A'}")
            y -= 15
            c.drawString(120, y, f"Similarity: {report.similarity_score or 0.0:.2%}")
            y -= 30
            
            # Commercial Use Detection
            if report.is_product:
                c.setFont("Helvetica-Bold", 13)
                c.drawString(100, y, "⚠️ COMMERCIAL USE DETECTED:")
                y -= 25
                c.setFont("Helvetica", 10)
                c.drawString(120, y, f"Listed as Product: YES")
                y -= 15
                if report.product_price:
                    c.drawString(120, y, f"Price: {report.product_currency or ''} {report.product_price}")
                    y -= 15
                if report.marketplace:
                    c.drawString(120, y, f"Marketplace/Platform: {report.marketplace}")
                    y -= 15
                y -= 15
            
            # Page Metadata Section
            if report.page_title or report.page_author or report.page_snippet:
                c.setFont("Helvetica-Bold", 13)
                c.drawString(100, y, "Page Metadata:")
                y -= 25
                c.setFont("Helvetica", 10)
                
                if report.page_title:
                    c.drawString(120, y, f"Title: {report.page_title[:80]}")
                    y -= 15
                if report.page_snippet:
                    snippet = report.page_snippet[:120] + "..." if len(report.page_snippet) > 120 else report.page_snippet
                    c.drawString(120, y, f"Description: {snippet}")
                    y -= 15
                if report.page_author:
                    c.drawString(120, y, f"Author: {report.page_author}")
                    y -= 15
                if report.page_copyright:
                    c.drawString(120, y, f"Copyright Notice: {report.page_copyright[:80]}")
                    y -= 15
                if report.page_tags:
                    try:
                        tags_str = ', '.join(report.page_tags[:5]) if isinstance(report.page_tags, list) else str(report.page_tags)
                        c.drawString(120, y, f"Tags: {tags_str[:80]}")
                        y -= 15
                    except:
                        pass
                if report.best_guess:
                    c.drawString(120, y, f"Image Identified As: {report.best_guess}")
                    y -= 15
                y -= 10
            
            # Search Position
            if report.serp_position:
                c.setFont("Helvetica", 10)
                c.drawString(100, y, f"Search Result Position: #{report.serp_position}")
                y -= 20
            
            # Footer
            y -= 20
            c.setFont("Helvetica", 8)
            c.drawString(100, y, f"Report generated by Sentinel AI - {datetime.utcnow().strftime('%B %d, %Y')}")
            
            c.save()
            
            logger.info(f"✅ Generated comprehensive PDF for report {report_id}")
            return FileResponse(pdf_path, filename=f"dmca_report_{report_id}.pdf", media_type="application/pdf")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Failed to download DMCA report {report_id}")
        raise HTTPException(status_code=500, detail=f"Failed to download report: {str(e)}")