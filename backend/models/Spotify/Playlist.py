from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Playlist(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    tracks_total: int
    owner: str
    public: bool
    
    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data['id'],
            name=data['name'],
            description=data.get('description'),
            tracks_total=data['tracks']['total'],
            owner=data['owner']['display_name'],
            public=data['public']
        )