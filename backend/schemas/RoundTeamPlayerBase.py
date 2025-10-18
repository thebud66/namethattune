from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .ParticipantBase import ParticipantWithPlayer

class RoundTeamPlayerBase(BaseModel):
    round_team_id: int
    participant_id: int

class RoundTeamPlayerCreate(RoundTeamPlayerBase):
    pass

class RoundTeamPlayer(RoundTeamPlayerBase):
    """Basic round team player"""
    round_team_player_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class RoundTeamPlayerWithParticipant(RoundTeamPlayer):
    """With participant details"""
    participant: ParticipantWithPlayer
    
    model_config = {"from_attributes": True}
