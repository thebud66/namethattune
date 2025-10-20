# backend/routes/SpotifyAuthRoutes.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests
import secrets
import json
from typing import Optional
from urllib.parse import urlencode
from datetime import datetime, timedelta
from ..config import get_settings
from ..database import get_db
from ..methods.GameplaySettingsMethods import get_setting_by_key, upsert_setting

router = APIRouter(prefix="/api/spotify/auth", tags=["spotify-auth"])

# Store state tokens temporarily (in production, use Redis or database)
state_tokens = {}

settings = get_settings()

# Spotify OAuth endpoints
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

# Required scopes for playback control and playlist access
SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-recently-played"
]


@router.get("/login")
async def spotify_login():
    """Initiate Spotify OAuth flow"""
    
    # Generate random state for CSRF protection
    state = secrets.token_urlsafe(16)
    state_tokens[state] = True
    
    # Build authorization URL
    params = {
        "client_id": settings.spotify_client_id,
        "response_type": "code",
        "redirect_uri": "http://127.0.0.1:8000/api/spotify/auth/callback",
        "state": state,
        "scope": " ".join(SCOPES),
        "show_dialog": "false"
    }
    
    auth_url = f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/callback")
async def spotify_callback(
    code: Optional[str] = None, 
    state: Optional[str] = None, 
    error: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Handle Spotify OAuth callback and store tokens in gameplay_settings"""
    
    if error:
        print(f"Spotify returned error: {error}")
        return RedirectResponse(url="http://127.0.0.1:3000/settings?error=" + error)
    
    if not state or state not in state_tokens:
        print(f"Invalid state token: {state}")
        return RedirectResponse(url="http://127.0.0.1:3000/settings?error=invalid_state")
    
    del state_tokens[state]
    
    if not code:
        print("No authorization code provided")
        return RedirectResponse(url="http://127.0.0.1:3000/settings?error=no_code")
    
    # Exchange code for access token
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": "http://127.0.0.1:8000/api/spotify/auth/callback",
        "client_id": settings.spotify_client_id,
        "client_secret": settings.spotify_client_secret
    }
    
    try:
        print("Exchanging code for tokens...")
        response = requests.post(SPOTIFY_TOKEN_URL, data=token_data)
        print(f"Spotify response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Spotify error response: {response.text}")
            return RedirectResponse(url=f"http://127.0.0.1:3000/settings?error=token_exchange_failed")
            
        response.raise_for_status()
        tokens = response.json()
        print("Successfully received tokens from Spotify")
        
        # Calculate expiration time
        expires_in = tokens.get("expires_in", 3600)
        expires_at = (datetime.now() + timedelta(seconds=expires_in)).isoformat()
        
        # Store access token in gameplay_settings
        print("Storing tokens in database...")
        upsert_setting(db, "SPOTIFY_ACCESS_TOKEN", tokens["access_token"])
        print("Stored access token")
        
        # Store refresh token if provided
        if "refresh_token" in tokens:
            upsert_setting(db, "SPOTIFY_REFRESH_TOKEN", tokens["refresh_token"])
            print("Stored refresh token")
        
        # Store expiration time
        upsert_setting(db, "SPOTIFY_TOKEN_EXPIRES_AT", expires_at)
        print("Stored expiration time")
        
        print("All tokens stored successfully, redirecting...")
        # Redirect to settings page with success
        return RedirectResponse(url="http://127.0.0.1:3000/settings?auth=success")
        
    except requests.exceptions.RequestException as e:
        print(f"Request exception: {str(e)}")
        return RedirectResponse(url=f"http://127.0.0.1:3000/settings?error=token_exchange_failed")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url=f"http://127.0.0.1:3000/settings?error=unknown_error")


@router.get("/token")
async def get_user_token(db: Session = Depends(get_db)):
    """Get the current user's access token (refresh if needed)"""
    
    # Check if token exists and is valid
    token_setting = get_setting_by_key(db, "SPOTIFY_ACCESS_TOKEN")
    expires_setting = get_setting_by_key(db, "SPOTIFY_TOKEN_EXPIRES_AT")
    
    if not token_setting or not expires_setting:
        raise HTTPException(
            status_code=401, 
            detail="No Spotify token available. Please authorize in settings."
        )
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(expires_setting.value)
    if datetime.now() >= expires_at:
        # Try to refresh
        try:
            new_token = await refresh_user_token(db)
            return {"access_token": new_token}
        except:
            raise HTTPException(
                status_code=401,
                detail="Token expired and refresh failed. Please re-authorize in settings."
            )
    
    return {"access_token": token_setting.value}


@router.post("/refresh")
async def refresh_user_token(db: Session = Depends(get_db)):
    """Refresh the user's access token"""
    
    refresh_token_setting = get_setting_by_key(db, "SPOTIFY_REFRESH_TOKEN")
    
    if not refresh_token_setting:
        raise HTTPException(
            status_code=401, 
            detail="No refresh token available. Please re-authorize in settings."
        )
    
    token_data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token_setting.value,
        "client_id": settings.spotify_client_id,
        "client_secret": settings.spotify_client_secret
    }
    
    try:
        response = requests.post(SPOTIFY_TOKEN_URL, data=token_data)
        response.raise_for_status()
        tokens = response.json()
        
        # Calculate new expiration
        expires_in = tokens.get("expires_in", 3600)
        expires_at = (datetime.now() + timedelta(seconds=expires_in)).isoformat()
        
        # Update token in gameplay_settings
        upsert_setting(db, "SPOTIFY_ACCESS_TOKEN", tokens["access_token"])
        upsert_setting(db, "SPOTIFY_TOKEN_EXPIRES_AT", expires_at)
        
        # Update refresh token if a new one was provided
        if "refresh_token" in tokens:
            upsert_setting(db, "SPOTIFY_REFRESH_TOKEN", tokens["refresh_token"])
        
        return tokens["access_token"]
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}")


@router.post("/logout")
async def logout(db: Session = Depends(get_db)):
    """Clear user tokens from gameplay_settings"""
    from ..methods.GameplaySettingsMethods import delete_setting
    
    # Delete all Spotify auth related settings
    try:
        delete_setting(db, "SPOTIFY_ACCESS_TOKEN")
        delete_setting(db, "SPOTIFY_REFRESH_TOKEN")
        delete_setting(db, "SPOTIFY_TOKEN_EXPIRES_AT")
    except:
        pass  # Settings might not exist
    
    return {"message": "Logged out successfully"}


@router.get("/status")
async def auth_status(db: Session = Depends(get_db)):
    """Check if user is authenticated"""
    
    token_setting = get_setting_by_key(db, "SPOTIFY_ACCESS_TOKEN")
    expires_setting = get_setting_by_key(db, "SPOTIFY_TOKEN_EXPIRES_AT")
    
    if not token_setting or not expires_setting:
        return {"authenticated": False, "has_token": False}
    
    # Check if token is expired
    try:
        expires_at = datetime.fromisoformat(expires_setting.value)
        is_valid = datetime.now() < expires_at
        return {
            "authenticated": is_valid,
            "has_token": True,
            "expires_at": expires_setting.value
        }
    except:
        return {"authenticated": False, "has_token": True}