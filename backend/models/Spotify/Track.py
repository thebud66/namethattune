from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Track(BaseModel):
    id: str
    name: str
    duration_ms: int
    popularity: int = 0
    artists: List[str]
    album: str
    
    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data['id'],
            name=data['name'],
            duration_ms=data['duration_ms'],
            popularity=data.get('popularity', 0),
            artists=[artist['name'] for artist in data['artists']],
            album=data['album']['name']
        )