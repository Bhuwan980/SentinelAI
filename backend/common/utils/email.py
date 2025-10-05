import smtplib
from email.mime.text import MIMEText
import os

def send_email(to: str, subject: str, body: str):
    """
    Sends a simple text email using Gmail SMTP.
    Works for dev/test — no external dependency.
    """
    sender = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASS")
    host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port = int(os.getenv("EMAIL_PORT", 587))

    if not sender or not password:
        raise ValueError("Missing EMAIL_USER or EMAIL_PASS in environment variables")

    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to

    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(sender, password)
            server.sendmail(sender, [to], msg.as_string())
            print(f"✅ Email sent successfully to {to}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")