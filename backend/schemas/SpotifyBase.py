from pydantic import BaseModel
from typing import List

class CreatePlaylistRequest(BaseModel):
    name: str
    public: bool = True
    description: str = ""


class AddTracksRequest(BaseModel):
    track_ids: List[str]
