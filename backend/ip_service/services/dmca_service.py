from sqlalchemy.orm import Session
from ip_service.models.ip_models import DmcaReports, IpMatches, Images
from common.utils.email import send_email  # hypothetical email util
from datetime import datetime

def create_dmca_report(db: Session, match_id: int, user_id: int):
    match = db.query(IpMatches).filter(IpMatches.id == match_id).first()
    if not match:
        raise ValueError("Match not found")

    image = db.query(Images).filter(Images.id == match.source_image_id).first()
    if not image:
        raise ValueError("Source image not found")

    # Generate DMCA evidence
    infringing_url = image.source_page_url or "Unknown source"
    screenshot_url = f"https://s3.amazonaws.com/sentinelai-dmca/screenshots/{match_id}.jpg"

    report = DmcaReports(
        user_id=user_id,
        match_id=match_id,
        infringing_url=infringing_url,
        screenshot_url=screenshot_url,
        status="submitted",
        created_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Send an email notification (optional)
    send_email(
        to="dmca@hostingsite.com",
        subject="DMCA Takedown Notice",
        body=f"""
Dear Hosting Provider,

This is an official DMCA takedown notice.

Original work: {image.image_url}
Infringing work: {infringing_url}
Reported by: user_id={user_id}

Screenshot: {screenshot_url}

Regards,
SentinelAI Automated DMCA Agent
"""
    )

    return report