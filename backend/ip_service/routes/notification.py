# ip_service/routes/notifications.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from common.db.db import get_db
from common.auth.auth import get_current_user
from ip_service.models.ip_models import Notifications

notification_router = APIRouter()

@notification_router.get("/", summary="List all user notifications")
def list_notifications(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve all notifications for the logged-in user."""
    notifications = db.query(Notifications).filter(Notifications.user_id == current_user.id).all()
    return [
        {
            "id": n.id,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at
        } for n in notifications
    ]