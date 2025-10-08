# backend/routes/SpotifyAuthRoutes.py
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
import requests
import secrets
from typing import Optional
from urllib.parse import urlencode
from ..config import get_settings

router = APIRouter(prefix="/api/spotify/auth", tags=["spotify-auth"])

# Store state tokens temporarily (in production, use Redis or database)
state_tokens = {}
# Store user tokens (in production, use database with encryption)
user_tokens = {}

settings = get_settings()

# Spotify OAuth endpoints
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

# Required scopes for Web Playback SDK
SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing"
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
        "show_dialog": "false"  # Set to "true" to force login dialog every time
    }
    
    auth_url = f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/callback")
async def spotify_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    """Handle Spotify OAuth callback"""
    
    # Check for errors
    if error:
        raise HTTPException(status_code=400, detail=f"Spotify auth error: {error}")
    
    # Verify state token
    if not state or state not in state_tokens:
        raise HTTPException(status_code=400, detail="Invalid state token")
    
    # Remove used state token
    del state_tokens[state]
    
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    # Exchange code for access token
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": "http://127.0.0.1:8000/api/spotify/auth/callback",
        "client_id": settings.spotify_client_id,
        "client_secret": settings.spotify_client_secret
    }
    
    try:
        response = requests.post(SPOTIFY_TOKEN_URL, data=token_data)
        response.raise_for_status()
        tokens = response.json()
        
        # Store tokens (in production, associate with user session)
        user_tokens["current_user"] = {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "expires_in": tokens["expires_in"]
        }
        
        # Redirect to frontend player page
        return RedirectResponse(url="http://127.0.0.1:3000?page=spotify-player&auth=success")
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to get access token: {str(e)}")


@router.get("/token")
async def get_user_token():
    """Get the current user's access token"""
    
    if "current_user" not in user_tokens:
        raise HTTPException(status_code=401, detail="No user token available. Please log in.")
    
    return {"access_token": user_tokens["current_user"]["access_token"]}


@router.post("/refresh")
async def refresh_user_token():
    """Refresh the user's access token"""
    
    if "current_user" not in user_tokens:
        raise HTTPException(status_code=401, detail="No user token available. Please log in.")
    
    refresh_token = user_tokens["current_user"].get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token available")
    
    token_data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": settings.spotify_client_id,
        "client_secret": settings.spotify_client_secret
    }
    
    try:
        response = requests.post(SPOTIFY_TOKEN_URL, data=token_data)
        response.raise_for_status()
        tokens = response.json()
        
        # Update stored token
        user_tokens["current_user"]["access_token"] = tokens["access_token"]
        if "refresh_token" in tokens:
            user_tokens["current_user"]["refresh_token"] = tokens["refresh_token"]
        
        return {"access_token": tokens["access_token"]}
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}")


@router.post("/logout")
async def logout():
    """Clear user tokens"""
    
    if "current_user" in user_tokens:
        del user_tokens["current_user"]
    
    return {"message": "Logged out successfully"}


@router.get("/status")
async def auth_status():
    """Check if user is authenticated"""
    
    is_authenticated = "current_user" in user_tokens
    return {
        "authenticated": is_authenticated,
        "has_token": is_authenticated
    }