from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from .SpotifyAuth import SpotifyAuth  # Changed from .SpotifyAuth
from .config import get_settings


class SpotifyAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to inject Spotify access token into requests"""
    
    def __init__(self, app, spotify_auth: SpotifyAuth):
        super().__init__(app)
        self.spotify_auth = spotify_auth
    
    async def dispatch(self, request: Request, call_next):
        print(f"DEBUG: Request path: {request.url.path}")
        
        # Skip auth for non-Spotify API routes
        if not request.url.path.startswith("/api/spotify"):
            print("DEBUG: Skipping - not a Spotify route")
            return await call_next(request)
        
        # Skip auth for docs
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            print("DEBUG: Skipping - docs route")
            return await call_next(request)
        
        try:
            # Get access token and inject into request state
            print("DEBUG: Getting Spotify token...")
            token = self.spotify_auth.get_access_token()
            print(f"DEBUG: Got token (first 20 chars): {token[:20] if token else 'None'}...")
            request.state.spotify_token = token
            print(f"DEBUG: Token set on request.state")
        except Exception as e:
            print(f"DEBUG: Exception getting token: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to get Spotify token: {str(e)}")
        
        response = await call_next(request)
        return response