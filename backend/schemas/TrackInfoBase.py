from pydantic import BaseModel
from datetime import datetime

class TrackInfoBase(BaseModel):
    song_id: int | None = None
    artist_id: int | None = None

class TrackInfoCreate(TrackInfoBase):
    pass

class TrackInfoUpdate(TrackInfoBase):
    pass

class TrackInfo(TrackInfoBase):
    track_info_id: int
    created_at: datetime
    updated_at: datetime | None = None

model_config = {
    "from_attributes": True
}
