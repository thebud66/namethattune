from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Artist(BaseModel):
    id: str
    name: str
    genres: List[str] = []
    popularity: int = 0
    followers: int = 0
    
    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data['id'],
            name=data['name'],
            genres=data.get('genres', []),
            popularity=data.get('popularity', 0),
            followers=data.get('followers', {}).get('total', 0)
        )