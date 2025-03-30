
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from models.authentication import auth_db

auth_router = APIRouter()
security = HTTPBearer()

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str]
    is_email_user: bool

class LoginResponse(BaseModel):
    user: UserResponse
    token: str

class MessageResponse(BaseModel):
    message: str

# Helper function to extract token from header
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = auth_db.validate_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

@auth_router.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        user, token = auth_db.authenticate_user(request.username, request.password)
        return LoginResponse(
            user=UserResponse(**user),
            token=token
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@auth_router.post("/api/auth/logout", response_model=MessageResponse)
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    success = auth_db.logout_user(token)
    if not success:
        raise HTTPException(status_code=400, detail="Logout failed")
    return {"message": "Successfully logged out"}

@auth_router.get("/api/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# Add this function to be used by other routers to verify authentication
def get_user_id_from_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    
    try:
        # Extract token (remove "Bearer " if present)
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        user = auth_db.validate_token(token)
        return user["id"] if user else None
    except Exception:
        return None

