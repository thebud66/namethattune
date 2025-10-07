from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Album(BaseModel):
    id: str
    name: str
    release_date: str
    total_tracks: int
    artists: List[str]
    
    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data['id'],
            name=data['name'],
            release_date=data['release_date'],
            total_tracks=data['total_tracks'],
            artists=[artist['name'] for artist in data['artists']]
        )