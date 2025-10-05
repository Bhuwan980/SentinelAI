# ip_service/routes/notifications.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from common.db.db import get_db
from common.auth.auth import get_current_user
from ip_service.models.ip_models import IpMatches, Notifications

notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ---------------------- List Notifications ----------------------
@notification_router.get("/", summary="Get all notifications for the logged-in user")
def get_notifications(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all notifications for the currently authenticated user.

    **Returns:**
    - List of notification objects:
        - `id`: int
        - `message`: str
        - `read`: bool
        - `created_at`: datetime
    """
    notifications = db.query(Notifications).filter(Notifications.user_id == current_user.id).all()
    return [
        {
            "id": n.id,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at
        }
        for n in notifications
    ]


# ---------------------- Confirm Match ----------------------
@notification_router.post("/confirm-match/{match_id}", summary="Confirm or reject an image match")
def confirm_match(
    match_id: int,
    confirm: bool,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm or reject a potential IP match.

    **Parameters:**
    - `match_id` (int): The ID of the match to confirm.
    - `confirm` (bool): Whether to confirm (True) or reject (False).

    **Behavior:**
    - If confirmed, a new notification is created indicating the DMCA process has started.

    **Returns:**
    - `success`: bool
    - `match_id`: int
    - `confirmed`: bool
    """
    match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match.user_confirmed = confirm
    db.commit()
    db.refresh(match)

    # Optionally, create a notification when confirmed
    if confirm:
        new_notification = Notifications(
            user_id=current_user.id,
            message=f"Match {match.id} confirmed. DMCA/report process started."
        )
        db.add(new_notification)
        db.commit()

    return {"success": True, "match_id": match.id, "confirmed": confirm}