from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .SongBase import Song
from .ArtistBase import Artist

class TrackInfoBase(BaseModel):
    song_id: int
    artist_id: int

class TrackInfoCreate(TrackInfoBase):
    pass

class TrackInfoUpdate(TrackInfoBase):
    pass

class TrackInfo(TrackInfoBase):
    """Basic track info without relationships"""
    track_info_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class TrackInfoWithDetails(TrackInfo):
    """With song and artist details"""
    song: Song
    artist: Artist
    
    model_config = {"from_attributes": True}