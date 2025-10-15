from pydantic import BaseModel
from datetime import datetime

class SongBase(BaseModel):
    spotify_id: int | None = None

class SongCreate(SongBase):
    pass

class SongUpdate(SongBase):
    pass

class Song(SongBase):
    song_id: int
    created_at: datetime
    updated_at: datetime | None = None

model_config = {
    "from_attributes": True,
}
