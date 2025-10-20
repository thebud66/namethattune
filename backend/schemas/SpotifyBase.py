# backend/schemas/SpotifyBase.py
# Add these models to the existing file

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class PlaybackRequest(BaseModel):
    context_uri: Optional[str] = None
    uris: Optional[List[str]] = None
    position_ms: Optional[int] = 0
    offset: Optional[Dict[str, Any]] = None

class CreatePlaylistRequest(BaseModel):
    name: str
    public: bool = True
    description: str = ""

class AddTracksRequest(BaseModel):
    track_ids: List[str]