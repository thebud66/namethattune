from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    id: str
    display_name: str = ""
    email: Optional[str] = None
    followers: int = 0
    country: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data['id'],
            display_name=data.get('display_name', ''),
            email=data.get('email'),
            followers=data.get('followers', {}).get('total', 0),
            country=data.get('country')
        )