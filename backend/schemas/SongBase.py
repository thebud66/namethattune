from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SongBase(BaseModel):
    spotify_id: str
    title: str  # NEW

class SongCreate(SongBase):
    pass

class SongUpdate(BaseModel):
    title: Optional[str] = None

class Song(SongBase):
    """Basic song without relationships"""
    song_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}