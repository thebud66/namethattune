from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ParticipantBase(BaseModel):
    game_id: int
    player_id: int
    seat_number: int

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantUpdate(BaseModel):
    seat_number: Optional[int] = None

class Participant(ParticipantBase):
    """Basic participant without relationships"""
    participant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

from .PlayerBase import Player

class ParticipantWithPlayer(Participant):
    """Participant with player details"""
    player: Player
    
    model_config = {"from_attributes": True}
