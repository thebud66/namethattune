import requests
from typing import Optional
from datetime import datetime, timedelta


class SpotifyAuth:
    """Handles Spotify OAuth authentication"""
    
    TOKEN_URL = "https://accounts.spotify.com/api/token"
    
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
    
    def get_access_token(self) -> str:
        """Get access token using Client Credentials flow (with caching)"""
        # Check if we have a valid cached token
        if self._access_token and self._token_expires_at:
            if datetime.now() < self._token_expires_at:
                return self._access_token
        
        # Request new token
        response = requests.post(
            self.TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(self.client_id, self.client_secret)
        )
        response.raise_for_status()
        
        data = response.json()
        self._access_token = data['access_token']
        expires_in = data['expires_in']  # seconds
        self._token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)  # 60s buffer
        
        return self._access_token
    
    @staticmethod
    def refresh_access_token(refresh_token: str, client_id: str, 
                            client_secret: str) -> str:
        """Refresh an access token (for user authorization flow)"""
        response = requests.post(
            SpotifyAuth.TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token
            },
            auth=(client_id, client_secret)
        )
        response.raise_for_status()
        return response.json()['access_token']
