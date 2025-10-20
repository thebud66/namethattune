# backend/middleware.py
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from .database import SessionLocal
from .methods.GameplaySettingsMethods import get_setting_by_key, upsert_setting
from .config import get_settings
from datetime import datetime, timedelta
import requests


class SpotifyAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to inject Spotify access token into requests"""
    
    def __init__(self, app, spotify_auth=None):
        super().__init__(app)
        self.settings = get_settings()
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for non-Spotify API routes
        if not request.url.path.startswith("/api/spotify"):
            return await call_next(request)
        
        # Skip auth for auth routes themselves
        if request.url.path.startswith("/api/spotify/auth"):
            return await call_next(request)
        
        # Skip auth for docs
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get database session
        db = SessionLocal()
        
        try:
            # Try to get valid token from gameplay_settings
            token_setting = get_setting_by_key(db, "SPOTIFY_ACCESS_TOKEN")
            expires_setting = get_setting_by_key(db, "SPOTIFY_TOKEN_EXPIRES_AT")
            
            if not token_setting or not expires_setting:
                db.close()
                raise HTTPException(
                    status_code=401,
                    detail="No Spotify authorization. Please authorize in settings."
                )
            
            # Check if token is expired
            try:
                expires_at = datetime.fromisoformat(expires_setting.value)
                
                if datetime.now() >= expires_at:
                    # Try to refresh the token
                    refresh_token_setting = get_setting_by_key(db, "SPOTIFY_REFRESH_TOKEN")
                    
                    if refresh_token_setting:
                        try:
                            # Refresh the token
                            token_data = {
                                "grant_type": "refresh_token",
                                "refresh_token": refresh_token_setting.value,
                                "client_id": self.settings.spotify_client_id,
                                "client_secret": self.settings.spotify_client_secret
                            }
                            
                            response = requests.post(
                                "https://accounts.spotify.com/api/token",
                                data=token_data
                            )
                            response.raise_for_status()
                            tokens = response.json()
                            
                            # Calculate new expiration
                            expires_in = tokens.get("expires_in", 3600)
                            new_expires_at = (datetime.now() + timedelta(seconds=expires_in)).isoformat()
                            
                            # Update tokens in database
                            upsert_setting(db, "SPOTIFY_ACCESS_TOKEN", tokens["access_token"])
                            upsert_setting(db, "SPOTIFY_TOKEN_EXPIRES_AT", new_expires_at)
                            
                            if "refresh_token" in tokens:
                                upsert_setting(db, "SPOTIFY_REFRESH_TOKEN", tokens["refresh_token"])
                            
                            # Use the new token
                            request.state.spotify_token = tokens["access_token"]
                            
                        except Exception as e:
                            db.close()
                            raise HTTPException(
                                status_code=401,
                                detail="Token expired and refresh failed. Please re-authorize in settings."
                            )
                    else:
                        db.close()
                        raise HTTPException(
                            status_code=401,
                            detail="Token expired and no refresh token available. Please re-authorize in settings."
                        )
                else:
                    # Token is still valid
                    request.state.spotify_token = token_setting.value
                    
            except ValueError:
                db.close()
                raise HTTPException(
                    status_code=500,
                    detail="Invalid token expiration format"
                )
            
        except HTTPException:
            db.close()
            raise
        except Exception as e:
            db.close()
            raise HTTPException(
                status_code=500,
                detail=f"Error getting Spotify token: {str(e)}"
            )
        
        db.close()
        response = await call_next(request)
        return response