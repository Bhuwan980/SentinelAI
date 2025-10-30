# ip_service/services/email_service.py - FIXED
import os
import logging
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Read from environment (already loaded in main.py)
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Debug logging
logger.info(f"🔍 Email Service Initialized:")
logger.info(f"   Host: {EMAIL_HOST}")
logger.info(f"   Port: {EMAIL_PORT}")
logger.info(f"   User: {EMAIL_USER}")
logger.info(f"   Pass exists: {EMAIL_PASS is not None}")

async def send_dmca_email(
    recipient_email: str,
    recipient_name: Optional[str],
    report_data: Dict[str, Any],
    pdf_path: str,
    user_info: Dict[str, Any],
    additional_message: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send DMCA report via email with PDF attachment.
    """
    try:
        # Validate email configuration
        if not EMAIL_USER or not EMAIL_PASS:
            error_msg = f"Email configuration missing. EMAIL_USER={EMAIL_USER is not None}, EMAIL_PASS={EMAIL_PASS is not None}"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        logger.info(f"📧 Attempting to send email from {EMAIL_USER} to {recipient_email}")
        
        # Create message
        message = MIMEMultipart()
        message["From"] = f"Sentinel AI DMCA <{EMAIL_USER}>"
        message["To"] = recipient_email
        message["Subject"] = f"DMCA Takedown Notice - Report #{report_data.get('id', 'N/A')}"
        
        # Email body
        recipient_display = recipient_name or "Sir/Madam"
        body = create_email_body(recipient_display, report_data, user_info, additional_message)
        
        # Attach body
        message.attach(MIMEText(body, "plain"))
        
        # Attach PDF if exists
        if os.path.exists(pdf_path):
            with open(pdf_path, "rb") as pdf_file:
                pdf_attachment = MIMEApplication(pdf_file.read(), _subtype="pdf")
                pdf_attachment.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=f"dmca_report_{report_data.get('id', 'N/A')}.pdf"
                )
                message.attach(pdf_attachment)
            logger.info(f"✅ PDF attached: {pdf_path}")
        else:
            logger.warning(f"⚠️ PDF not found: {pdf_path}")
        
        # Send email
        logger.info(f"📤 Sending email via {EMAIL_HOST}:{EMAIL_PORT}")
        await aiosmtplib.send(
            message,
            hostname=EMAIL_HOST,
            port=EMAIL_PORT,
            username=EMAIL_USER,
            password=EMAIL_PASS,
            start_tls=True,
        )
        
        logger.info(f"✅ DMCA email sent successfully to {recipient_email}")
        
        return {
            "success": True,
            "message": f"DMCA report sent successfully to {recipient_email}",
            "sent_at": datetime.utcnow().isoformat(),
            "recipient": recipient_email
        }
        
    except aiosmtplib.SMTPException as e:
        logger.error(f"❌ SMTP error sending email: {str(e)}")
        return {
            "success": False,
            "error": f"SMTP error: {str(e)}",
            "message": "Failed to send email due to SMTP error"
        }
    except Exception as e:
        logger.exception(f"❌ Failed to send DMCA email to {recipient_email}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to send email: {str(e)}"
        }


def create_email_body(
    recipient_name: str,
    report_data: Dict[str, Any],
    user_info: Dict[str, Any],
    additional_message: Optional[str] = None
) -> str:
    """Create formatted email body for DMCA notice."""
    
    body = f"""Dear {recipient_name},

This is a formal DMCA takedown notice regarding copyright infringement detected on your platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    DMCA TAKEDOWN NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report ID: #{report_data.get('id', 'N/A')}
Date: {datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COPYRIGHT HOLDER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: {user_info.get('full_name') or user_info.get('username', 'N/A')}
Email: {user_info.get('email', 'N/A')}
{f"Phone: {user_info.get('phone_number', 'N/A')}" if user_info.get('phone_number') else ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFRINGEMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Infringing Content URL:
{report_data.get('infringing_url', 'N/A')}

Original Copyrighted Work URL:
{report_data.get('original_image_url', 'N/A')}

Similarity Score: {float(report_data.get('similarity_score', 0)) * 100:.1f}%
Detection Date: {report_data.get('created_at', 'N/A')}

{f"Description: {report_data.get('image_caption', 'N/A')}" if report_data.get('image_caption') else ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEGAL STATEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOOD FAITH BELIEF:
I have a good faith belief that the use of the copyrighted material 
described above is not authorized by the copyright owner, its agent, 
or the law.

ACCURACY STATEMENT:
I swear, under penalty of perjury, that the information in this 
notification is accurate and that I am the copyright owner or 
authorized to act on behalf of the owner of an exclusive right 
that is allegedly infringed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUESTED ACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I request that you immediately:
1. Remove or disable access to the infringing material identified above
2. Provide confirmation of removal within 48 hours
3. Take appropriate action against the user who uploaded this content

"""

    if additional_message:
        body += f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL MESSAGE FROM COPYRIGHT HOLDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{additional_message}

"""

    body += f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPORTING DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please find the complete DMCA report attached as a PDF document 
containing detailed evidence, screenshots, and supporting information.

If you have any questions regarding this notice, please contact the 
copyright holder at the email address provided above.

Thank you for your prompt attention to this matter.

Best regards,
{user_info.get('full_name') or user_info.get('username', 'Copyright Holder')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This notice was generated by Sentinel AI - IP Protection Platform
https://sentinelai.com

For questions about this service, contact: support@sentinelai.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message sent on behalf of the copyright holder.
For authenticity verification, please contact the sender directly.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    return body


# ✅ FIX: Return tuple instead of bool
def validate_email_config() -> tuple[bool, str]:
    """
    Validate email configuration is set up correctly.
    
    Returns:
        tuple[bool, str]: (is_valid, message)
    """
    if not EMAIL_USER or not EMAIL_PASS:
        message = f"Email configuration missing - EMAIL_USER exists: {EMAIL_USER is not None}, EMAIL_PASS exists: {EMAIL_PASS is not None}"
        logger.error(f"❌ {message}")
        return False, message  # ✅ Returns tuple
    
    message = f"Email configuration valid. Using: {EMAIL_USER}"
    logger.info(f"✅ {message}")
    return True, message  # ✅ Returns tuple