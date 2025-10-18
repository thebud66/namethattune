from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from .ParticipantBase import ParticipantWithPlayer
from .RoundBase import Round
from .RoundBase import RoundWithDetails

class GameBase(BaseModel):
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class GameCreate(GameBase):
    """For creating a game"""
    pass

class GameUpdate(GameBase):
    """For updating a game"""
    pass

class Game(GameBase):
    """Basic game without relationships"""
    game_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

# Import for relationships (put at bottom to avoid circular imports)
class GameWithParticipants(Game):
    """Game with participants"""
    participants: List[ParticipantWithPlayer] = []
    
    model_config = {"from_attributes": True}

class GameWithRounds(Game):
    """Game with rounds"""
    rounds: List[Round] = []
    
    model_config = {"from_attributes": True}

class GameFull(Game):
    """Game with all relationships"""
    participants: List[ParticipantWithPlayer] = []
    rounds: List[RoundWithDetails] = []
    
    model_config = {"from_attributes": True}
