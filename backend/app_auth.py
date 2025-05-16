
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import traceback

from models.authentication import auth_db

auth_router = APIRouter()
security = HTTPBearer()

# Check if debug mode is enabled from .env
DEBUG_MODE = os.getenv("DEBUG", "False").lower() == "true"

def debug_log(message: str, data=None):
    """Log debug messages only if in debug mode"""
    if DEBUG_MODE:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if data:
            print(f"[AUTH_DEBUG {timestamp}] {message}: {data}")
        else:
            print(f"[AUTH_DEBUG {timestamp}] {message}")

class LoginRequest(BaseModel):
    username: str
    password: str

class CreateUserRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

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
    
    if DEBUG_MODE:
        masked_token = f"{token[:10]}...{token[-5:]}" if token and len(token) > 15 else "***"
        debug_log(f"Validating token", {"token": masked_token})
    
    user = auth_db.validate_token(token)
    
    if not user:
        if DEBUG_MODE:
            debug_log("Invalid or expired token")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    if DEBUG_MODE:
        debug_log("Token validation successful", {"user_id": user.get("id"), "username": user.get("username")})
    
    return user

@auth_router.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        if DEBUG_MODE:
            debug_log(f"Login attempt", {"username": request.username})
        
        user, token = auth_db.authenticate_user(request.username, request.password)
        
        if DEBUG_MODE:
            debug_log(f"Login successful", {"user_id": user.get("id"), "username": user.get("username")})
            masked_token = f"{token[:10]}...{token[-5:]}" if token and len(token) > 15 else "***"
            debug_log(f"Generated token", {"token": masked_token})
        
        return LoginResponse(
            user=UserResponse(**user),
            token=token
        )
    except ValueError as e:
        if DEBUG_MODE:
            debug_log(f"Login failed", {"username": request.username, "error": str(e)})
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        if DEBUG_MODE:
            debug_log(f"Login error", {"username": request.username, "error": str(e), "traceback": traceback.format_exc()})
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@auth_router.post("/api/auth/logout", response_model=MessageResponse)
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        
        if DEBUG_MODE:
            masked_token = f"{token[:10]}...{token[-5:]}" if token and len(token) > 15 else "***"
            debug_log(f"Logout attempt", {"token": masked_token})
        
        success = auth_db.logout_user(token)
        
        if not success:
            if DEBUG_MODE:
                debug_log("Logout failed", {"success": success})
            raise HTTPException(status_code=400, detail="Logout failed")
        
        if DEBUG_MODE:
            debug_log("Logout successful")
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        if DEBUG_MODE:
            debug_log(f"Logout error", {"error": str(e), "traceback": traceback.format_exc()})
        raise HTTPException(status_code=500, detail=f"Logout error: {str(e)}")

@auth_router.get("/api/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    if DEBUG_MODE:
        debug_log("Get user profile", {"user_id": user.get("id"), "username": user.get("username")})
    return UserResponse(**user)

@auth_router.post("/api/auth/create-user", response_model=UserResponse)
async def create_user(request: CreateUserRequest, user: dict = Depends(get_current_user)):
    # Only allow creation if authenticated
    try:
        if DEBUG_MODE:
            debug_log(f"Creating new user", {
                "creator_id": user.get("id"), 
                "creator_username": user.get("username"),
                "new_username": request.username,
                "has_email": bool(request.email)
            })
        
        new_user = auth_db.create_user(
            username=request.username,
            password=request.password,
            email=request.email
        )
        
        if DEBUG_MODE:
            debug_log(f"User created successfully", {"new_user_id": new_user.get("id")})
        
        return UserResponse(**new_user)
    except ValueError as e:
        if DEBUG_MODE:
            debug_log(f"User creation failed", {"error": str(e)})
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if DEBUG_MODE:
            debug_log(f"User creation error", {"error": str(e), "traceback": traceback.format_exc()})
        raise HTTPException(status_code=500, detail=f"User creation error: {str(e)}")

# Add this function to be used by other routers to verify authentication
def get_user_id_from_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        if DEBUG_MODE:
            debug_log("No authorization header provided")
        return None
    
    try:
        # Extract token (remove "Bearer " if present)
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        
        if DEBUG_MODE:
            masked_token = f"{token[:10]}...{token[-5:]}" if token and len(token) > 15 else "***"
            debug_log(f"Extracting user from token", {"token": masked_token})
        
        user = auth_db.validate_token(token)
        
        if user:
            if DEBUG_MODE:
                debug_log("User found from token", {"user_id": user["id"]})
            return user["id"]
        else:
            if DEBUG_MODE:
                debug_log("Invalid token, no user found")
            return None
    except Exception as e:
        if DEBUG_MODE:
            debug_log(f"Error extracting user from token", {"error": str(e)})
        return None
