from pydantic import BaseModel, Field
from datetime import datetime

class ArtistBase(BaseModel):
    spotify_id: int
    
class ArtistCreate(ArtistBase):
    pass

class ArtistUpdate(ArtistBase):
    pass

class Artist(ArtistBase):
    artist_id: int
    created_at: datetime
    updated_at: datetime | None = None


model_config = {
    "from_attributes": True,
}
