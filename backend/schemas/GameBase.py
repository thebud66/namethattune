# backend/schemas/GameBase.py
from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .PlayerBase import Player

# Base Models
class GameBase(BaseModel):
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class GameCreate(GameBase):
    pass

class GameUpdate(BaseModel):
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class Game(GameBase):
    game_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended Models with Relationships
class PlayerInParticipant(BaseModel):
    player_id: int
    name: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ParticipantInGame(BaseModel):
    participant_id: int
    game_id: int
    player_id: int
    seat_number: int
    created_at: datetime
    updated_at: datetime
    player: PlayerInParticipant

    class Config:
        from_attributes = True

class RoundInGame(BaseModel):
    round_id: int
    game_id: int
    round_number: int
    is_complete: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GameWithParticipants(Game):
    participants: List[ParticipantInGame] = []

class GameFull(Game):
    participants: List[ParticipantInGame] = []
    rounds: List[RoundInGame] = []