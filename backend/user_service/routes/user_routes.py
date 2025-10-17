from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, ValidationError
from datetime import datetime
from jose import jwt
from passlib.context import CryptContext
from common.db.db import get_db
from user_service.models.user_models import User
from user_service.schemas.user_schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ProfileUpdateSchema
)
from common.auth.auth import get_current_user
from user_service.services.user_services import (
    create_user,
    authenticate_user,
    login_user,
    generate_reset_token,
    reset_password,
    login_with_google
)
from scrapping.uploader import upload_to_s3, generate_presigned_url, _normalize_s3_key
from fastapi.responses import JSONResponse
import logging
import re
import boto3
from botocore.exceptions import ClientError

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key"  # Replace with a secure key from environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# S3 Configuration
AWS_BUCKET = "sentinelai980"
AWS_REGION = "us-east-1"
PROFILE_PICTURE_EXPIRATION = 604800  # 7 days for profile pictures
s3_client = boto3.client("s3", region_name=AWS_REGION)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def delete_s3_object(s3_path: str) -> bool:
    """
    Delete an object from S3 bucket.
    Returns True if successful, False otherwise.
    """
    if not s3_path:
        return False
    
    try:
        key = _normalize_s3_key(s3_path)
        s3_client.delete_object(Bucket=AWS_BUCKET, Key=key)
        logger.info(f"✅ Deleted S3 object: {key}")
        return True
    except ClientError as e:
        logger.error(f"❌ Failed to delete S3 object {s3_path}: {e}")
        return False


@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    logger.debug(f"Signup payload: {user.dict()}")
    db_user = create_user(db, user)
    return db_user


@router.post("/login", response_model=TokenResponse)
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    try:
        logger.debug(f"Login payload: {form_data.dict()}")
        db_user = authenticate_user(db, form_data.email, form_data.password)
        if not db_user:
            raise HTTPException(status_code=400, detail="Invalid credentials")
        return login_user(db_user)
    except ValidationError as e:
        logger.error(f"Validation error: {e.errors()}")
        raise HTTPException(status_code=422, detail=f"Invalid input: {e.errors()}")


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.last_login = None
    db.commit()
    return {"message": "Logout successful. Please discard your token client-side."}


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = generate_reset_token(user)
    return {"message": "Password reset token generated", "token": token}


@router.post("/reset-password")
def reset_password_route(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    success = reset_password(db, request.token, request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"message": "Password reset successful"}


@router.post("/google-login", response_model=TokenResponse)
def google_login(email: str, username: str = None, db: Session = Depends(get_db)):
    return login_with_google(db, google_email=email, username=username)


@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user profile with fresh presigned URL for profile picture.
    """
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate fresh presigned URL if profile picture exists
    user_data = UserResponse.from_orm(db_user)
    if db_user.profile_image_url:
        try:
            # Generate a fresh presigned URL with 7-day expiration
            fresh_url = generate_presigned_url(
                db_user.profile_image_url, 
                expiration=PROFILE_PICTURE_EXPIRATION
            )
            user_data.profile_image_url = fresh_url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            # Keep the stored key/URL if presigned URL generation fails
    
    return user_data


@router.patch("/me")
def update_profile(
    form_data: ProfileUpdateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile. Profile picture should be updated via /upload-avatar endpoint.
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_fields = form_data.dict(exclude_unset=True)
    
    # Validation
    for key, value in updated_fields.items():
        if key == "username" and value:
            if not (3 <= len(value) <= 30 and re.match(r"^[a-zA-Z0-9_]+$", value)):
                raise HTTPException(
                    status_code=400, 
                    detail="Username must be 3-30 characters (letters, numbers, underscores)"
                )
        if key == "full_name" and value and len(value) > 100:
            raise HTTPException(status_code=400, detail="Full name must be under 100 characters")
        if key == "bio" and value and len(value) > 500:
            raise HTTPException(status_code=400, detail="Bio must be under 500 characters")
        if key == "phone_number" and value and not re.match(r"^\+?[\d\s-]{7,15}$", value):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        
        # Don't allow direct profile_picture updates through this endpoint
        if key != "profile_image_url":
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    
    # Generate fresh presigned URL for response
    response_data = UserResponse.from_orm(user)
    if user.profile_image_url:
        try:
            fresh_url = generate_presigned_url(
                user.profile_image_url, 
                expiration=PROFILE_PICTURE_EXPIRATION
            )
            response_data.profile_picture = fresh_url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
    
    return response_data


@router.post("/change-password")
def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not pwd_context.verify(current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = pwd_context.hash(new_password)
    db.commit()
    db.refresh(user)

    return {"success": True, "message": "Password changed successfully"}


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload user avatar to S3 and return presigned URL.
    Deletes old avatar if it exists.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to read uploaded file")
    
    # Validate file size (5MB limit)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    try:
        # Get current user from database
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete old profile picture from S3 if exists
        if user.profile_image_url:
            logger.info(f"Deleting old profile picture for user {user.id}")
            delete_s3_object(user.profile_image_url)
        
        # Upload new image to S3
        # Store the S3 key (not presigned URL) in database for permanence
        s3_key = upload_to_s3(
            file_data=content,
            user_id=user.id,
            original_filename=file.filename,
            prefix="avatars",  # Will create users/{user_id}/avatars/{uuid}.{ext}
            make_presigned=False  # Get S3 key instead of presigned URL
        )
        
        logger.info(f"✅ Uploaded avatar for user {user.id}: {s3_key}")
        
        # Save S3 key to database
        user.profile_image_url = s3_key
        db.commit()
        db.refresh(user)
        
        # Generate presigned URL for immediate use (7 days expiration)
        presigned_url = generate_presigned_url(s3_key, expiration=PROFILE_PICTURE_EXPIRATION)
        
        return {
            "success": True,
            "message": "Profile picture uploaded successfully",
            "url": presigned_url,  # Return presigned URL for frontend
            "s3_key": s3_key  # Optional: return key for reference
        }
        
    except ValueError as e:
        # Image validation error from uploader
        logger.error(f"Image validation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        # S3 upload error from uploader
        logger.error(f"S3 upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image to storage")
    except Exception as e:
        logger.exception(f"Unexpected error uploading avatar: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


@router.delete("/delete-avatar")
def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user's profile picture from S3 and database.
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.profile_image_url:
        raise HTTPException(status_code=404, detail="No profile picture to delete")
    
    # Delete from S3
    deleted = delete_s3_object(user.profile_image_url)
    
    # Remove from database
    user.profile_image_url = None
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": "Profile picture deleted successfully",
        "s3_deleted": deleted
    }