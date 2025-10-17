import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import traceback
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

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
ip_router = APIRouter()

class ConfirmMatchRequest(BaseModel):
    user_confirmed: bool


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


# -----------------------
# Upload & Run Pipeline
# ----------------------
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
                if m.matched_asset and m.matched_asset.file_url:
                    matched_url = safe_generate_url(m.matched_asset.file_url)
                
                matches.append({
                    "id": m.id,
                    "matched_asset_id": m.matched_asset_id,
                    "matched_image_url": matched_url,
                    "similarity_score": float(m.similarity_score) if m.similarity_score else 0.0,
                    "user_confirmed": m.user_confirmed,
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


# -----------------------
# List My Images
# -----------------------
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


# -----------------------
# Match History
# -----------------------
@ip_router.get("/match-history", response_model=List[MatchResponse])
def get_match_history(
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get match history for all images owned by the current user."""
    try:
        # Get user's image IDs
        user_images = db.query(Images.id).filter(Images.user_id == current_user.id).all()
        image_ids = [img.id for img in user_images]

        if not image_ids:
            logger.info(f"ℹ️ No images found for user {current_user.id}")
            return []

        # Get matches for those images
        matches = db.query(IpMatches).filter(IpMatches.source_image_id.in_(image_ids)).all()
        
        result = []
        for m in matches:
            try:
                matched_url = "https://via.placeholder.com/300?text=Image+Not+Available"
                if m.matched_asset and m.matched_asset.file_url:
                    matched_url = safe_generate_url(m.matched_asset.file_url)
                
                result.append({
                    "id": m.id,
                    "source_image_id": m.source_image_id,
                    "matched_asset_id": m.matched_asset_id,
                    "matched_image_url": matched_url,
                    "similarity_score": float(m.similarity_score) if m.similarity_score else 0.0,
                    "user_confirmed": m.user_confirmed,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                })
            except Exception as match_error:
                logger.warning(f"⚠️ Failed to process match {m.id}: {match_error}")
                continue
        
        logger.info(f"✅ Retrieved {len(result)} matches for user {current_user.id}")
        return result
        
    except Exception as e:
        logger.exception(f"❌ Failed to fetch match history for user {current_user.id}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch match history: {str(e)}")


# -----------------------
# Get Matches for Image
# -----------------------
@ip_router.get("/matches/{image_id}")
async def get_matches(
    image_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all unconfirmed matches for a specific image."""
    try:
        # Verify image belongs to user
        image = db.query(Images).filter(
            Images.id == image_id,
            Images.user_id == current_user.id
        ).first()
        
        if not image:
            raise HTTPException(status_code=404, detail="Image not found or access denied")

        # Get matches
        matches = (
            db.query(IpMatches, IpAssets)
            .join(IpAssets, IpMatches.matched_asset_id == IpAssets.id)
            .filter(IpMatches.source_image_id == image_id)
            .filter(IpMatches.user_confirmed.is_(None))
            .all()
        )
        
        result = []
        for match in matches:
            try:
                matched_url = safe_generate_url(
                    match.IpAssets.file_url if match.IpAssets else None
                )
                
                result.append({
                    "id": match.IpMatches.id,
                    "asset_id": match.IpMatches.matched_asset_id,
                    "url": matched_url,
                    "caption": match.IpAssets.title if match.IpAssets else "No caption",
                    "image_similarity": float(match.IpMatches.similarity_score) if match.IpMatches.similarity_score else 0.0,
                    "text_similarity": float(match.IpMatches.similarity_score) if match.IpMatches.similarity_score else 0.0,
                })
            except Exception as match_error:
                logger.warning(f"⚠️ Failed to process match {match.IpMatches.id}: {match_error}")
                continue
        
        logger.info(f"✅ Retrieved {len(result)} unconfirmed matches for image {image_id}")
        return {"matches": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Failed to fetch matches for image {image_id}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch matches: {str(e)}")


# -----------------------
# Confirm Match
# -----------------------
@ip_router.post("/confirm-match/{match_id}")
async def confirm_match(
    match_id: int, 
    request: ConfirmMatchRequest, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Confirm or reject a match and optionally create a DMCA report."""
    try:
        # Get match
        match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Verify ownership
        source_image = db.query(Images).filter(Images.id == match.source_image_id).first()
        if not source_image or source_image.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update match confirmation
        try:
            match.user_confirmed = request.user_confirmed
            db.commit()
            logger.info(f"✅ Updated match id={match_id} with user_confirmed={request.user_confirmed}")
        except Exception as update_error:
            db.rollback()
            logger.exception(f"❌ Failed to update match {match_id}")
            raise HTTPException(status_code=500, detail=f"Failed to update match: {str(update_error)}")

        # Create DMCA report if confirmed
        if request.user_confirmed:
            try:
                original_image = db.query(Images).filter(Images.id == match.source_image_id).first()
                matched_asset = db.query(IpAssets).filter(IpAssets.id == match.matched_asset_id).first()
                
                original_url = safe_generate_url(
                    original_image.s3_path if original_image else None,
                    placeholder="N/A"
                )
                matched_url = safe_generate_url(
                    matched_asset.file_url if matched_asset else None,
                    placeholder="N/A"
                )
                
                report_data = {
                    "match_id": match_id,
                    "infringing_url": matched_url,
                    "screenshot_url": f"https://s3.amazonaws.com/sentinelai-dmca/screenshots/{match_id}.jpg",
                    "original_image_url": original_url,
                    "image_caption": matched_asset.title if matched_asset else "No caption",
                    "similarity_score": float(match.similarity_score) if match.similarity_score else 0.0,
                    "status": "pending",
                    "created_at": datetime.utcnow()
                }
                
                create_dmca_report(db, current_user.id, report_data)
                logger.info(f"✅ Created DMCA report for match id={match_id}")
                
            except Exception as dmca_error:
                logger.exception(f"❌ Failed to create DMCA report for match {match_id}")
                # Don't fail the request if DMCA creation fails
                logger.warning(f"⚠️ Match confirmed but DMCA report creation failed: {dmca_error}")

        return {"success": True, "message": "Match confirmation updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"❌ Failed to confirm match {match_id}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm match: {str(e)}")


# -----------------------
# DMCA Reports
# -----------------------
@ip_router.get("/dmca/reports")
def list_dmca_reports(
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """List all DMCA reports for the current user."""
    try:
        reports = db.query(DmcaReports).filter(DmcaReports.user_id == current_user.id).all()
        
        result = []
        for r in reports:
            try:
                result.append({
                    "id": r.id,
                    "infringing_url": r.infringing_url,
                    "original_image_url": r.original_image_url,
                    "image_caption": r.image_caption,
                    "similarity_score": float(r.similarity_score) if r.similarity_score else 0.0,
                    "status": r.status,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                })
            except Exception as report_error:
                logger.warning(f"⚠️ Failed to process report {r.id}: {report_error}")
                continue
        
        logger.info(f"✅ Retrieved {len(result)} DMCA reports for user {current_user.id}")
        return {"reports": result}
        
    except Exception as e:
        logger.exception(f"❌ Failed to fetch DMCA reports for user {current_user.id}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch DMCA reports: {str(e)}")


@ip_router.get("/dmca/report/{report_id}/download")
def download_dmca_report(
    report_id: int, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Download a DMCA report as a PDF with full metadata."""
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
            # Fallback to basic PDF generation if enhanced generator not available
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
            
            # Infringing Content
            c.setFont("Helvetica-Bold", 13)
            c.drawString(100, y, "Infringing Content:")
            y -= 25
            c.setFont("Helvetica", 10)
            c.drawString(120, y, f"URL: {report.infringing_url or 'N/A'}")
            y -= 20
            c.drawString(120, y, f"Similarity: {report.similarity_score or 0.0:.2%}")
            y -= 40
            
            # Metadata if available
            if report.page_title or report.page_author:
                c.setFont("Helvetica-Bold", 13)
                c.drawString(100, y, "Page Metadata:")
                y -= 25
                c.setFont("Helvetica", 10)
                
                if report.page_title:
                    c.drawString(120, y, f"Title: {report.page_title[:80]}")
                    y -= 20
                if report.page_author:
                    c.drawString(120, y, f"Author: {report.page_author}")
                    y -= 20
                if report.page_copyright:
                    c.drawString(120, y, f"Copyright: {report.page_copyright[:80]}")
                    y -= 20
                if report.page_tags:
                    tags_str = ', '.join(report.page_tags[:5])
                    c.drawString(120, y, f"Tags: {tags_str[:80]}")
                    y -= 20
            
            c.save()
            
            logger.info(f"✅ Generated basic PDF for report {report_id}")
            return FileResponse(pdf_path, filename=f"dmca_report_{report_id}.pdf")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Failed to download DMCA report {report_id}")
        raise HTTPException(status_code=500, detail=f"Failed to download report: {str(e)}")