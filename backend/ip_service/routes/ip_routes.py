from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from ip_service.services.ip_services import execute_ip_pipeline
from ip_service.services.ip_notification import get_user_notifications, create_notification
from ip_service.services.dmca_service import create_dmca_report
from common.auth.auth import get_current_user
from common.db.db import get_db
from ip_service.models.ip_models import Images, IpMatches, DmcaReports
from ip_service.schemas.ip_schemas import MatchResponse

ip_router = APIRouter(prefix="/ip", tags=["Intellectual Property (IP) Management"])

# ==========================================================
# 🧠 IP Protection Endpoints
# ==========================================================

# ---------------------- 1. Run Image Pipeline ----------------------
@ip_router.post("/run-pipeline")
async def run_pipeline_endpoint(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    """
    Upload an image for IP scanning and similarity detection.

    note:
        - Takes an image file as input.
        - Runs embedding, captioning, and similarity search.
        - Returns a JSON response with similarity results if any are found.

    Parameters:
        - **file**: UploadFile — Image file to analyze.
        - **Authorization Header**: Bearer JWT of logged-in user.

    Response:
        {
            "success": true,
            "matches": [
                {"match_id": 1, "score": 0.89, "matched_url": "https://..."},
                ...
            ]
        }
    """
    try:
        file_bytes = await file.read()
        result = execute_ip_pipeline(file_bytes, user_id=current_user.id)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Pipeline failed"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# ---------------------- 2. List User Uploaded Images ----------------------
@ip_router.get("/my-images")
def get_my_images(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all images uploaded by the authenticated user.

    note:
        - Returns list of uploaded image records with metadata.
        - Each image may have similarity results or pending status.

    Response:
        {
            "images": [
                {
                    "id": 123,
                    "image_url": "https://...",
                    "status": "processed",
                    "created_at": "2025-10-05T12:00:00Z"
                },
                ...
            ]
        }
    """
    images = db.query(Images).filter(Images.user_id == current_user.id).all()
    return {"images": [
        {
            "id": img.id,
            "image_url": img.image_url,
            "status": img.status,
            "created_at": img.created_at
        } for img in images
    ]}


# ---------------------- 3. Match History ----------------------
@ip_router.get("/match-history", response_model=List[MatchResponse])
def get_match_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all image matches associated with the user's uploads.

    note:
        - Returns all matches found by the similarity pipeline.
        - Each match includes score and confirmation status.

    Response Example:
        [
            {
                "id": 10,
                "source_image_id": 3,
                "matched_asset_id": 22,
                "similarity_score": 0.93,
                "user_confirmed": null,
                "created_at": "2025-10-05T10:00:00Z"
            }
        ]
    """
    user_images = db.query(Images.id).filter(Images.user_id == current_user.id).all()
    image_ids = [img.id for img in user_images]

    if not image_ids:
        return []

    matches = db.query(IpMatches).filter(IpMatches.source_image_id.in_(image_ids)).all()
    return matches


# ---------------------- 4. User Notifications ----------------------
@ip_router.get("/notifications")
def list_user_notifications(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all system notifications for the current user.

    note:
        - Includes DMCA updates, match confirmations, and alerts.

    Response:
        {
            "notifications": [
                {
                    "id": 1,
                    "message": "Match found for your uploaded image.",
                    "read": false,
                    "created_at": "2025-10-05T09:32:00Z"
                }
            ]
        }
    """
    notifications = get_user_notifications(db, current_user.id)
    return {"notifications": [
        {
            "id": n.id,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at
        } for n in notifications
    ]}


# ---------------------- 5. Confirm or Reject Match ----------------------
@ip_router.post("/confirm-match/{match_id}")
def confirm_match(
    match_id: int,
    confirm: bool,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm or reject a detected image match.

    note:
        - If confirmed, a DMCA report is automatically generated.
        - Also triggers a user notification.

    Parameters:
        - **match_id**: int — Match record ID.
        - **confirm**: bool — True (confirm) or False (reject).

    Response:
        {
            "status": "success",
            "dmca_report_id": 5
        }
    """
    match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match.user_confirmed = confirm
    db.commit()
    db.refresh(match)

    if confirm:
        create_notification(
            db=db,
            user_id=current_user.id,
            message=f"Match confirmed for image ID {match.source_image_id}. Preparing DMCA report."
        )
        report = create_dmca_report(db, match_id, current_user.id)
        return {"status": "success", "dmca_report_id": report.id}

    return {"status": "rejected", "match_id": match.id}


# ---------------------- 6. List DMCA Reports ----------------------
@ip_router.get("/dmca/reports")
def list_dmca_reports(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all DMCA takedown reports submitted by the user.

    note:
        - Each report includes infringing URL, screenshot proof, and status.

    Response:
        {
            "reports": [
                {
                    "id": 5,
                    "infringing_url": "https://infringing-site.com/image.jpg",
                    "status": "submitted",
                    "created_at": "2025-10-05T09:32:00Z"
                }
            ]
        }
    """
    reports = db.query(DmcaReports).filter(DmcaReports.user_id == current_user.id).all()
    return {"reports": [
        {
            "id": r.id,
            "infringing_url": r.infringing_url,
            "status": r.status,
            "created_at": r.created_at,
        } for r in reports
    ]}