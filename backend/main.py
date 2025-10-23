# main.py
import os
from dotenv import load_dotenv

# ✅ CRITICAL: Load .env FIRST - before any other imports
load_dotenv()

# Print to verify environment variables are loaded
print("=" * 60)
print("🔍 Environment Variables Check (main.py startup)")
print("=" * 60)
print(f"EMAIL_HOST: {os.getenv('EMAIL_HOST')}")
print(f"EMAIL_PORT: {os.getenv('EMAIL_PORT')}")
print(f"EMAIL_USER: {os.getenv('EMAIL_USER')}")
print(f"EMAIL_PASS exists: {os.getenv('EMAIL_PASS') is not None}")
print(f"EMAIL_PASS length: {len(os.getenv('EMAIL_PASS', ''))}")
print("=" * 60)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from common.db.db import Base, engine
from user_service.routes.user_routes import router as user_router
from ip_service.routes.ip_routes import ip_router
from ip_service.routes.notification import notification_router

app = FastAPI(title="Sentinel AI Backend")

origins = [
    "http://localhost:5173",        
    "https://caleb-oliguretic-nonreticently.ngrok-free.dev",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer()

# Create tables
Base.metadata.create_all(bind=engine)

# Register routers
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(ip_router, prefix="/ip", tags=["Image Protection"])
app.include_router(notification_router, prefix="/notifications", tags=["Notification"])


@app.get("/")
def test():
    return {"message": "Welcome to Sentinel AI API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}