# user_service/routes/user_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from user_service.models.user_models import User
from user_service.schemas.user_schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from user_service.services.user_services import (
    create_user,
    authenticate_user,
    login_user,
    generate_reset_token,
    reset_password,
    login_with_google
)
from common.db.db import get_db
from common.auth.auth import get_current_user  # for logout

router = APIRouter(prefix="/users", tags=["Users"])

# ---------------------- Signup ----------------------
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """
   Register a new user.

    **Parameters:**
    - `user`: JSON body with fields:
        - `username` (str): Unique username.
        - `email` (str): Valid email address.
        - `password` (str): Minimum 8 characters.
    - `db`: SQLAlchemy session dependency.

    **Returns:**
    - User profile details including:
        - `id`, `username`, `email`, `created_at`.

    **Note:** This route creates a new user account and stores hashed passwords.
   
    """
    db_user = create_user(db, user)
    return db_user


# ---------------------- Login ----------------------
@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and issue JWT token.

    **Parameters:**
    - `user`: JSON body with:
        - `email` (str): Registered email.
        - `password` (str): User password.
    - `db`: SQLAlchemy session dependency.

    **Returns:**
    - `access_token` (JWT): Token used for authenticated requests.
    - `token_type`: Always "bearer".

    **Note:** Token expiration is handled automatically by backend configuration.
   
    """
    db_user = authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return login_user(db_user)


# ---------------------- Logout ----------------------
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Log out the currently authenticated user.

    **Parameters:**
    - `current_user`: Active user derived from JWT token.
    - `db`: SQLAlchemy session dependency.

    **Returns:**
    - JSON message confirming logout.

    **Note:** JWT tokens remain valid until expiration; clients should discard them manually.
   
    """
    current_user.last_login = None  # optional: reset login state
    db.commit()
    return {"message": "Logout successful. Please discard your token client-side."}


# ---------------------- Forgot / Reset Password ----------------------
@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
     Generate a password reset token and send it via email.

    **Parameters:**
    - `request`: JSON body with:
        - `email` (str): Registered user email.
    - `db`: SQLAlchemy session dependency.

    **Returns:**
    - JSON with:
        - `"message"`: Confirmation text.
        - `"token"`: Password reset token (for testing).

    **Note:** In production, token will be sent through email, not returned in response.
   
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = generate_reset_token(user)
    # TODO: send token via email
    return {"message": "Password reset token generated", "token": token}


@router.post("/reset-password")
def reset_password_route(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using a valid token.

    **Parameters:**
    - `request`: JSON body with:
        - `token` (str): Token generated from forgot password route.
        - `new_password` (str): New password for user.
    - `db`: SQLAlchemy session dependency.

    **Returns:**
    - JSON with `"message": "Password reset successful"`.

    **Note:** Tokens expire after a configured time window (e.g., 15 minutes).
 
    """
    success = reset_password(db, request.token, request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"message": "Password reset successful"}


# ---------------------- Google OAuth Login ----------------------
@router.post("/google-login", response_model=TokenResponse)
def google_login(email: str, username: str = None, db: Session = Depends(get_db)):
    """
    Log in or register a user via Google OAuth.

    **Parameters:**
    - `email` (str): Google-verified email.
    - `username` (str, optional): Optional username if first-time login.
    - `db`: SQLAlchemy session dependency.

    **Returns:**
    - JWT `access_token` and `token_type`.

    **Note:** If the user doesn’t exist, a new account is created automatically.
  
    """
    return login_with_google(db, google_email=email, username=username)