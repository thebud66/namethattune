from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ArtistBase(BaseModel):
    spotify_id: str
    name: str  # NEW
    
class ArtistCreate(ArtistBase):
    pass

class ArtistUpdate(BaseModel):
    name: Optional[str] = None

class Artist(ArtistBase):
    """Basic artist without relationships"""
    artist_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}