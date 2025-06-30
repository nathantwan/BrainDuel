from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from database import get_db
from services import create_user, authenticate_user, create_access_token, get_current_user, get_user_from_token 
from schemas.auth import UserCreateRequest, TokenResponse, UserResponse, LoginRequest
from models import User


router = APIRouter(prefix="/auth", tags=["auth"])

# route to sign up a new user
@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserCreateRequest, db: Session = Depends(get_db)):
    user = create_user(user_data, db)
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }

# route to login a user and generates a JWT token
@router.post("/login", response_model=TokenResponse)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(form_data.email, form_data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# route to get current user information
@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user = Depends(get_current_user),
):
    return current_user

@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """
    Logout endpoint - could be used to blacklist tokens if you implement that
    For now, it just confirms the user is authenticated
    """
    return {"message": "Successfully logged out"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
):
    """
    Refresh access token
    """
    try:
        # Get user from current token
        user = get_user_from_token(credentials.credentials, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Create new access token
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh token"
        )
