from sqlalchemy.orm import Session
from ip_service.models.ip_models import Notifications

def create_notification(db: Session, user_id: int, message: str):
    """Create a new notification for a user"""
    notification = Notifications(user_id=user_id, message=message)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def get_user_notifications(db: Session, user_id: int):
    """Retrieve unread notifications for a user"""
    return db.query(Notifications).filter(Notifications.user_id == user_id).order_by(Notifications.created_at.desc()).all()

def mark_notification_as_read(db: Session, notification_id: int):
    """Mark a notification as read"""
    notification = db.query(Notifications).filter(Notifications.id == notification_id).first()
    if notification:
        notification.read = True
        db.commit()
        db.refresh(notification)
    return notification